var inflection = require('inflection');

/*
 * DEFINITION
 */
exports.definition = {
  mixinCallback: function(){
    this.table_name = inflection.underscore(inflection.pluralize(this.model_name));
  },
  
  getName: function(){
    return this.table_name;
  }
};


/*
 * STORE
 */
exports.store = {
  getByTableName: function(table_name){
    for(var i in this.models){
      if(this.models[i].definition.table_name == table_name){
        return this.models[i];
      }
    }
  }
}

