var should = require('should');
var Store = require('../../../lib/store');


module.exports = function(title, beforeFn, afterFn, store_conf){
  
  describe(title + ': Select', function(){
    var store;
  
    before(beforeFn);
    after(function(next){
      afterFn(next, store);
    }); 
    
  
    before(function(){
      store = new Store(store_conf);
      store.setMaxListeners(0);

      store.Model('User', function(){
        this.hasMany('posts');
        this.hasMany('threads');
      });
      store.Model('Post', function(){
        this.belongsTo('user');
        this.belongsTo('thread');
      });
      store.Model('Thread', function(){
        this.belongsTo('user');
        this.hasMany('posts');
      });
    });
  
    
    it('returns only selected fields', function(done){
      store.ready(function(){
        var User = store.Model('User');
        
        User.find(1).select('id', 'login').exec(function(user){
          user.login.should.be.equal('phil');
          should.not.exist(user.email);
          done();
        });
      });
    });
    
    it('returns only selected fields (asJson())', function(done){
      store.ready(function(){
        var User = store.Model('User');
        
        User.find(1).select('id', 'login').asJson().exec(function(user){
          user.should.be.eql({
            id: 1,
            login: 'phil'
          });
          done();
        });
      });
    });
    
    it('works with joins (automatic asJson())', function(done){
      store.ready(function(){
        var User = store.Model('User');
        
        User.find(1).select('users.id', 'login', 'message').join('posts').exec(function(user){
          user.should.be.eql({
            id: 1,
            login: 'phil',
            message: 'first message'
          });
          done();
        });
      });
    });
    
    it('works with aggregate functions', function(done){
      store.ready(function(){
        var User = store.Model('User');
        
        User.select('count(*) as count').exec(function(count){
          count.should.be.eql([{
            count: 4
          }]);
          done();
        });
      });
    });
          
  });
    
}  