var validator = require('validator');
/*
 * STORE
 */
exports.store = {

  mixinCallback: function(){
        
    this.addType('TEXT', function(value){
      if(value === null) return null;
      return validator.toString(value);
    }, {migration:['string', 'text']});
            
    this.addType('INTEGER', function(value){
      if(value === null) return null;
      return validator.toInt(value);
    }, {migration:'integer'});
    
    this.addType('REAL', function(value){
      if(value === null) return null;
      return validator.toFloat(value);
    }, {migration:'float'});
    
    this.addType('BOOLEAN', function(value){
      if(value === null) return null;
      return validator.toBoolean(value);
    }, {migration:'boolean'});
    
    this.addType('DATE', function(value){
      if(value === null) return null;
      return validator.toDate(value);
    }, {migration:'date'});
    
    this.addType('DATETIME', function(value){
      if(value === null) return null;
      return validator.toDate(value);
    }, {migration:'datetime'});
    
    this.addType('TIME', function(value){
      if(value === null) return null;
      return validator.toDate(value);
    }, {migration:'time'});
    
    this.addType('BLOB', function(value){
      if(value === null) return null;
      return validator.toDate(value);
    }, {migration:'binary'});
        
  }
};