var Knex = require('knex');

/*
 * STORE
 */
exports.store = {
  mixinCallback: function(){
    
    this.connection = Knex.initialize({
      client: 'pg',
      connection: {
        host     : this.config.host,
        port     : this.config.port,
        user     : this.config.user,
        password : this.config.password,
        database : this.config.database,
        charset  : this.config.charset
      }
    });
    
  },
  
  close: function(callback){
    this.connection.client.pool.destroy(callback);
  }
};
