/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  var boardName = 'new-board';
  var boardId = '';
  var threadId = '';
  var replyId = '';

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST /api/threads/:board', function() {
      
      test('Test POST /api/threads/:board with password', function(done){
        chai.request(server)
          .post('/api/threads/' + boardName)
          .send({
            board:boardName,
            text:'This is a test',
            delete_password:'123'
          })
          .end(function(err, res){
            // console.log(res.body);
            assert.equal(res.status, 200);
            assert.equal(res.body.text, 'This is a test');
            assert.match(res.body._id.toString(), /^([a-f]|[0-9]){24}/, "_id"); // _id hex: 5e1f76abaee15426aa457e5c 
            threadId = res.body._id.toString();
            done();
        });
      });
      
    });
    
    suite('GET  /api/threads/:board', function() {
      // /api/threads/{board}
      test('Test GET /api/threads/:board', function(done){
        chai.request(server)
        .get('/api/threads/' + boardName)
        .end(function(err, res){
          assert.equal(res.status, 200);
          // console.log(res.body.length);
          assert.isAtMost(res.body.length, 10);          
          assert.match(res.body[0]._id.toString(), /^([a-f]|[0-9]){24}/, "_id"); // _id hex: 5e1f76abaee15426aa457e5c 
          done();
        })
      });
  
      
    });
    
  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST /api/replies/:board', function() {
      
      test ('Test POST /api/replies/:board ', function(done){
        chai.request(server)
        .post('/api/replies/' + boardName)
        .send({
          board:boardName,
          text:'this is a reply',
          delete_password:'123',
          thread_id:threadId
        })
        .end(function(err, res){
          assert.equal(res.status, 200)
          // console.log(res.body);
          assert.equal(res.body.replies[0].text,'this is a reply');
          assert.match(res.body.replies[0]._id.toString(), /^([a-f]|[0-9]){24}/, "_id"); // _id hex: 5e1f76abaee15426aa457e5c 
          replyId = res.body.replies[0]._id.toString();
          done();
        })
      })
      
    });
    
    suite('GET /api/replies/:board', function() {
      test('Test GET /api/replies/:board', function(done){
        chai.request(server)
        .get('/api/replies/' + boardName)
        .send({thread_id:threadId})
        .end(function(err, res){
          assert.equal(res.status, 200);
          // console.log(res.body);
          assert.isAtMost(res.body.length, 10);          
          assert.match(res.body[0]._id.toString(), /^([a-f]|[0-9]){24}/, "_id"); // _id hex: 5e1f76abaee15426aa457e5c 
          done();
        })
      });
      
    });
    
    suite('PUT /api/replies/:board', function() {
       
      test('Test PUT /api/replies/:board', function(done){
        chai.request(server)
          .put('/api/replies/' + boardName)
          .send({
            board:boardName,
            thread_id:threadId,
            reply_id:replyId,
            reported:true
          })
          .end(function(err, res){
            // console.log(res.body); 
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success');
            done();
        });
      });
      
    });
    
    suite('DELETE /api/replies/:board', function() {
      test('Test DELETE /api/replies/:board', function(done){
        chai.request(server)
          .delete('/api/replies/' + boardName)
          .send({
            board:boardName,
            thread_id:threadId,
            reply_id:replyId,
            delete_password:'123'
          })
          .end(function(err, res){
            // console.log(res.body);
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success');
            done();
        });
      });
      
    });
    
  });
  
  suite('API ROUTING FOR /api/threads/:board', function() {
  
    
    suite('PUT /api/threads/:board', function() {
       
      test('Test PUT /api/threads/:board', function(done){
        chai.request(server)
          .put('/api/threads/' + boardName)
          .send({
            board:boardName,
            thread_id:threadId,
            reported:true
          })
          .end(function(err, res){
            // console.log(res.body); 
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success');
            done();
        });
      });
      
    });

    suite('DELETE /api/threads/:board', function() {
      
      test('Test DELETE /api/threads/:board', function(done){
        chai.request(server)
          .delete('/api/threads/' + boardName)
          .send({
            board:boardName,
            thread_id:threadId,
            delete_password:'123'
          })
          .end(function(err, res){
            // console.log(res.body);
            assert.equal(res.status, 200);
            assert.equal(res.body, 'success');
            done();
        });
      });
      
    });

  });

  

});
