var Utils = require('../../utils');
var Helper = require('../../persistence/helper');


/*
 * MODEL
 */
exports.model = {
  /**
   * Joins one or multiple relations with the current model
   * @class Model
   * @method join
   * @param {string} relation - The relation name which should be joined.
   * @param {string} type - Optional join type (Allowed are `left`, `inner`, `outer` and `right`).
   * or
   * @param {array} relations - Array of relation names
   * or
   * @param {object} relations - For nested relational joins use objects
   *
   * @see Model.exec
   *
   * @return {Model}
   */
  join: function(relations, type){
    var self = this.chain();

    if(typeof type == 'string' && ['left', 'inner', 'outer', 'right'].indexOf(type.toLowerCase()) != -1){
      if(!(relations instanceof Array)){
        relations = [relations];
      }
    }else{
      relations = Utils.args(arguments);
      type = 'left';
    }
           
    relations = Helper.sanitizeRelations(self, relations);
    
    for(var i = 0; i < relations.length; i++){
      if(relations[i].relation.polymorph){
        throw new Error("Can't join polymorphic relations");
      }else{
        self.addInternal('joins', {
          relation:relations[i].relation, 
          type:type, 
          parent:relations[i].parent,
          name_tree: relations[i].name_tree,
          as: relations[i].as
        });
      }      
    }
    
    return self;
  },
  
  
  /**
   * Left joins one or multiple relations with the current model
   * @class Model
   * @method leftJoin
   * @param {string} relation - The relation name which should be joined.
   * or
   * @param {array} relations - Array of relation names
   * or
   * @param {object} relations - For nested relational joins use objects
   *
   * @see Model.exec
   *
   * @return {Model}
   */
  leftJoin: function(){
    return this.join(Utils.args(arguments), 'left');
  },
  
  
  /**
   * Right joins one or multiple relations with the current model
   * @class Model
   * @method rightJoin
   * @param {string} relation - The relation name which should be joined.
   * or
   * @param {array} relations - Array of relation names
   * or
   * @param {object} relations - For nested relational joins use objects
   *
   * @see Model.exec
   *
   * @return {Model}
   */
  rightJoin: function(){
    return this.join(Utils.args(arguments), 'right');
  },
  
  
  /**
   * Inner joins one or multiple relations with the current model
   * @class Model
   * @method innerJoin
   * @param {string} relation - The relation name which should be joined.
   * or
   * @param {array} relations - Array of relation names
   * or
   * @param {object} relations - For nested relational joins use objects
   *
   * @see Model.exec
   *
   * @return {Model}
   */
  innerJoin: function(){
    return this.join(Utils.args(arguments), 'inner');
  },
  
  
  /**
   * Outer joins one or multiple relations with the current model
   * @class Model
   * @method outerJoin
   * @param {string} relation - The relation name which should be joined.
   * or
   * @param {array} relations - Array of relation names
   * or
   * @param {object} relations - For nested relational joins use objects
   *
   * @see Model.exec
   *
   * @return {Model}
   */
  outerJoin: function(){
    return this.join(Utils.args(arguments), 'outer');
  }
};



/*
 * DEFINITION
 */
exports.definition = {

  mixinCallback: function(){
    var self = this;  
    
    this._autojoin = {};

    this.beforeFind(function(query){
      if(self._autojoin.enabled){
        var conditions = this.getInternal('conditions') || [];
        var relations = [];
        for(var i = 0; i < conditions.length; i++){
          if(conditions[i].name_tree.length > 0){
            if(self._autojoin.relations.length == 0 || self._autojoin.relations.indexOf(conditions[i].name_tree[conditions[i].name_tree.length - 1]) != -1){
              relations.push(Helper.nameTreeToRelation(conditions[i].name_tree));
            }            
          }          
        }
        if(relations.length > 0){
          this.join(relations);
        }
      }
      
      
      var joins = this.getInternal('joins') || [];
      var table_map = {};
    
      for(var i = 0; i < joins.length; i++){
        var relation = joins[i].relation;
        var name_tree = joins[i].name_tree;
        var table_name = relation.model.definition.table_name;
        
        var parent_name = Helper.nameTreeToNames(joins[i].parent.definition.table_name, name_tree.slice(0, -1));
        var name = Helper.nameTreeToNames(table_name, name_tree);
        
        var as = '';        
        
        if(table_name != name){
          as = ' AS ' + name;
        }
        
        joins[i].name = name;
        table_map[name_tree.join('.')] = name;
        
        //TODO: raw conditions via this.where
        //this.where(Helper.nameTreeToCondition(name_tree, relation.conditions));
        var extra_conditions = Helper.sanitizeCondition(self.model, relation.conditions);
                
        query.join(table_name + as, function(){
          this.on(parent_name + '.' + relation.primary_key, '=', name + '.' + relation.foreign_key);
          
          for(var i = 0; i < extra_conditions.length; i++){
            var cond = extra_conditions[i];
            var tname = Helper.nameTreeToNames(cond.table, cond.name_tree);
            var value = cond.value;

            if(cond.value){ //TODO: check for column names...
              query.bindings.push(cond.value);
              value = self.store.connection.raw('?');
            }else{
              value = self.store.connection.raw('NULL');
            }
            
            this.andOn(tname + '.' + cond.field, cond.operator, value);
          }
        }, joins[i].type);
      }
         
      this.setInternal('table_map', table_map);
            
      return true;
    }, -20);
    
    
    
    this.afterFind(function(data){
      var records = data.result;
      var joins = this.getInternal('joins') || [];
      
      if(joins.length === 0) return true;
                 
                 
      //Combines arrays of records and subrecords by their key
      var deepCombine = function(data, primary_keys, depth){
        var keys = {};
        var records = [];
        
        depth = depth || 0;
                
        for(var r in data){
          var key = []; 
                 
          if(primary_keys.length > 0){
            for(var p in primary_keys){
              key.push(data[r][primary_keys[p]]);
            }
            key = key.join(',');
          }else{
            key = r;
          }

          if(!keys[key]){
            keys[key] = data[r];
            records.push(data[r]);
          }else{
            for(var i in joins){
              var relation = joins[i].relation;
              var names = joins[i].name_tree;   
                            
              if(relation.type == 'has_many'){           
                var sub = data[r][names[depth]];
                var ori = keys[key][names[depth]];
                                
                if(ori && sub){    
                  if(ori && !(ori instanceof Array)){
                    keys[key][names[depth]] = ori = [ori];
                  }
                              
                  ori.push(sub);
                  keys[key][names[depth]] = deepCombine(ori, relation.model.definition.primary_keys, depth + 1);
                }                
                
              }
              
            }
          }          
          
        }
        
        return records;
      }
      
      data.result = deepCombine(records, self.primary_keys);
      return true;
      
    }, 90);
    
  },
  
  
  
  
  /**
   * Enable automatic joins on tables referenced in conditions
   * @class Definition
   * @method autoJoin
   * @param {object} options - Optional configuration options
   *
   * @options
   * @param {array} relations - Only use the given relations for the automatic joins.
   * @param {integer} limit - how many joins are allowed
   *
   * @return {Definition}
   */
  autoJoin: function(options){
    this._autojoin = options || {};
    this._autojoin.enabled = true;
    this._autojoin.relations = this._autojoin.relations || [];
    return this;
  }
};