var Utils = require('../../utils');

var OPERATORS = {
  not: '!=',
  gt: '>',
  gte: '=>',
  lt: '<',
  lte: '=<',
  like: 'like',
  not_like: 'not like',
  between: 'between',
  ilike: 'ilike'   
};

/*
 * MODEL
 */
exports.model = {
  find: function(){
    var args = Utils.args(arguments);
    var primary_keys = this.definition.primary_keys;
    
    var where = {};
    var callback;
    var find_one = true;
    
    if(typeof args[args.length -1] == 'function'){
      callback = args.pop();      
    }
    
    if(args.length == primary_keys.length){
      for(var i = 0; i < primary_keys.length; i++){
        where[primary_keys[i]] = args[i];
        
        if(args[i] instanceof Array){
          find_one = false;
        }
      }
      args = [where];
    }
    
    if(callback){
      args.push(callback);
    }
    
    var self = this.where.apply(this, args);    
    if(find_one) self.limit(1);
    
    return self;
  },
  
  
  
  
  where: function(){
    var self = this.chain();
    var args = Utils.args(arguments);
    
    var callback;
    
    if(typeof args[args.length -1] == 'function'){
      callback = args.pop();      
    }
      
    
    var sanitize = function(conditions, table){

      if(conditions[0] instanceof Array){
        return sanitize(conditions[0], table);
      }
      
      var model = self.definition.store.getByTableName(table);
      
      //if we use something like ["login = ?", "phil"]
      if(typeof conditions[0] == 'string'){
        var query = conditions.shift();
        var args = conditions;
        if(args.length == 1 && typeof args[0] == 'object' && !(args[0] instanceof Array)){
      
          //if we use ["login = :login", {login:"phil"}]
          var values = conditions[0];
          var tmp = [];        
          args = [];        
          query = query.replace(/\:(\w+)/g, function(result, field){
            args.push(values[field]);
            return '?'
          }); 
        }
      
        self.addInternal('conditions', {type:'raw', query:query, args:args});
      
      }else{

        //if we use {login:'phil'} or {login_like:'phil'}
        for(var i in conditions){
          for(var name in conditions[i]){
            if(typeof conditions[i][name] == 'object' && !(conditions[i][name] instanceof Array)){
              sanitize([conditions[i][name]], name);
            }else{
              var tmp = name.match(
                new RegExp('(.+?)(_(' + Object.keys(OPERATORS).join('|') + ')|)$', 'i')
              );

              self.addInternal('conditions', {
                type:'hash',
                table: table, 
                field: tmp[1], 
                operator: OPERATORS[tmp[3]] || '=',                 
                value: model ? model.definition.cast(tmp[1], conditions[i][name]) : conditions[i][name]
              });
            }
          }
        }      
      }
    };
    
    sanitize(args, self.definition.table_name);  
    
    
    
    
    if(callback){
      self.exec(callback);
    }
    
    return self;
  }
  
};







/*
 * DEFINITION
 */
exports.definition = {
  mixinCallback: function(){
    var self = this;    
    
    this.beforeFind(function(query){
      var conditions = this.getInternal('conditions') || [];
  
      for(var i in conditions){
        if(conditions[i].type == 'raw'){
          query.whereRaw(conditions[i].query, conditions[i].args);
        }else{
          var name = conditions[i].field;
          var table = conditions[i].table;
          var value = conditions[i].value;
          var operator = conditions[i].operator

          if(value instanceof Array){
            if(operator == '!='){
              query.whereNotIn(table + '.' + name, value);
            }else{
              if(operator == '='){
                query.whereIn(table + '.' + name, value);
              }else{
                query.where(function(){
                  for(var i in value){
                    this.orWhere(table + '.' + name, operator, value[i]);
                  }                  
                })
              }
            }              
          }else{
            query.where(table + '.' + name, operator, value);
          }
        }
      }
      
      return true;
    });
    
  }  
  
}