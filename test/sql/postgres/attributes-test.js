var should = require('should');

var Store = require('../../../lib/store');


describe('Postgres: all Attributes', function(){
  var store;
  var database = 'all_attributes_test';
  
  
  
  before(function(next){
    this.timeout(5000);
    beforePG(database, [
      'CREATE EXTENSION hstore',
      'CREATE TABLE attribute_tests(char_attribute  varchar(255), float_attribute float, integer_attribute  integer, text_attribute text, boolean_attribute boolean, binary_attribute bytea, date_attribute date, datetime_attribute timestamp without time zone, time_attribute time, hstore_attribute hstore)',
      'CREATE TABLE attribute_join_tests(attribute_test_id integer)',
      "INSERT INTO attribute_tests VALUES('abcd', 2.3345, 3243, 'some text', true, 'some binary data', '2014-02-18', '2014-02-18 15:45:02', '15:45:01', hstore(ARRAY['key', 'value', 'nested', '{\\\"key\\\": \\\"value\\\"}']))",
      'INSERT INTO attribute_join_tests VALUES(3243)'
    ], next);
  });
  
  before(function(){
    store = new Store({
      host: 'localhost',
      type: 'postgres',
      database: database,
      user: 'postgres',
      password: ''
    });

    store.Model('AttributeTest', function(){
      this.hasMany('attribute_join_tests', {primary_key:'integer_attribute', foreign_key:'attribute_test_id'});
    });
    store.Model('AttributeJoinTest', function(){
      this.belongsTo('attribute_test', {foreign_key:'integer_attribute'});
    });
    
    store.on('exception', function(){});
  });
  
  after(function(next){
    afterPG(database, next);   
  });
    
      
    
  
  it('have all attributes loaded', function(done){
    store.ready(function(){    
      var AttributeTest = store.Model('AttributeTest');

      var attrs = AttributeTest.definition.attributes;
            
      attrs.should.have.property('char_attribute');
      attrs.should.have.property('float_attribute');
      attrs.should.have.property('integer_attribute');
      attrs.should.have.property('text_attribute');
      attrs.should.have.property('boolean_attribute'); 
      attrs.should.have.property('binary_attribute');
      attrs.should.have.property('date_attribute');
      attrs.should.have.property('datetime_attribute');
      attrs.should.have.property('time_attribute');
      attrs.should.have.property('hstore_attribute');
    
      done();
    });
  });
  
  
  it('casts all values', function(done){
    store.ready(function(){    
      var AttributeTest = store.Model('AttributeTest');
      AttributeTest.limit(1).exec(function(record){
        record.char_attribute.should.be.equal('abcd');
        record.float_attribute.should.be.equal(2.3345);
        record.integer_attribute.should.be.equal(3243);
        record.text_attribute.should.be.equal('some text');
        record.boolean_attribute.should.be.equal(true);
        record.binary_attribute.should.be.eql(new Buffer('some binary data', 'utf-8'));
        record.date_attribute.toString().should.be.equal('2014-02-18');

        if(new Date().getTimezoneOffset() <= -60){ //my local test timezone
          record.datetime_attribute.toJSON().should.be.equal('2014-02-18T14:45:02.000Z');
        }else{ //travis-ci timezone
          record.datetime_attribute.toJSON().should.be.equal('2014-02-18T15:45:02.000Z');
        }
        
        record.time_attribute.toString().should.be.equal('15:45'); //TODO: offer config options to return a specific format for date and time...
        record.hstore_attribute.should.be.eql({key:'value', nested:{key: 'value'}});
        
        done();
      });
    });
  });
  
  
  it('casts all values on a join', function(done){
    store.ready(function(){    
      var AttributeTest = store.Model('AttributeTest');
      AttributeTest.join('attribute_join_tests').limit(1).exec(function(record){
        record.char_attribute.should.be.equal('abcd');
        record.float_attribute.should.be.equal(2.3345);
        record.integer_attribute.should.be.equal(3243);
        record.text_attribute.should.be.equal('some text');
        record.boolean_attribute.should.be.equal(true);
        record.binary_attribute.should.be.eql(new Buffer('some binary data', 'utf-8'));
        record.date_attribute.toString().should.be.equal('2014-02-18');

        if(new Date().getTimezoneOffset() <= -60){ //my local test timezone
          record.datetime_attribute.toJSON().should.be.equal('2014-02-18T14:45:02.000Z');
        }else{ //travis-ci timezone
          record.datetime_attribute.toJSON().should.be.equal('2014-02-18T15:45:02.000Z');
        }
        
        record.time_attribute.toString().should.be.equal('15:45'); //TODO: offer config options to return a specific format for date and time...
        record.hstore_attribute.should.be.eql({key:'value', nested:{key: 'value'}});
        
        done();
      });
    });
  });


  it('write all values', function(done){
    store.ready(function(){    
      var AttributeTest = store.Model('AttributeTest');
      var now = new Date('2014-04-25 20:03:00');
      
      
      AttributeTest.create({
        char_attribute: 'aaaa',
        float_attribute: 1.00001,
        integer_attribute: 5555,
        text_attribute: 'text',
        boolean_attribute: true,
        binary_attribute: new Buffer('abcdefghijklmnopqrstuvwxyz', 'utf-8'),
        date_attribute: now,
        datetime_attribute: now,
        time_attribute: now,
        hstore_attribute: {a:'11', b:'22', foo:{bar:['phil', 'michl']}}
      }, function(success){
        success.should.be.true;
        
        AttributeTest.limit(1, 1).exec(function(record){

          record.char_attribute.should.be.equal('aaaa');
          record.float_attribute.should.be.equal(1.00001);
          record.integer_attribute.should.be.equal(5555);
          record.text_attribute.should.be.equal('text');
          record.boolean_attribute.should.be.equal(true);
          record.binary_attribute.should.be.eql(new Buffer('abcdefghijklmnopqrstuvwxyz', 'utf-8'));
          record.date_attribute.toString().should.be.equal('2014-04-25');

          record.datetime_attribute.toJSON().should.be.equal(now.toJSON());
        
          record.time_attribute.toString().should.be.equal('20:03'); //TODO: offer config options to return a specific format for date and time...
          record.hstore_attribute.should.be.eql({a:'11', b:'22', foo:{bar:['phil', 'michl']}});
        
          done();
        });
        
      });
    });
  });
    
});

