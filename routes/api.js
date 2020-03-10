/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect    = require('chai').expect;
var mongoose  = require('mongoose');

module.exports = function (app) {

  mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
  console.log("DB state: " + mongoose.connection.readyState);
  
  const Schema = mongoose.Schema;

  const boardSchema = new Schema({
    board: { type: String, required: true }
  });
  
  const replySchema = new Schema({
    text: { type: String, required: true },
    created_on: { type: Date, required: true },
    delete_password: { type: String },
    reported: { type: Boolean }
  });

  const threadSchema = new Schema({
    board_id: { type: mongoose.ObjectId, required: true },
    text: { type: String, required: true },
    created_on: { type: Date, required: true },
    bumped_on: { type: Date, required: true },
    reported: { type: Boolean },
    delete_password: { type: String },
    replies: { type:[replySchema], default:undefined }
  });

  
  let Board = mongoose.model("Board", boardSchema);
  let Thread = mongoose.model("Thread", threadSchema);
  let Reply = mongoose.model("Reply", replySchema);
  
  function findBoard(board){
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1){  // db connected
        Board.findOne({ board:board }, function(err, boardFound){
          if (err) {
            console.error(err);
            resolve(false);
          }
          (boardFound) ? resolve(boardFound) : resolve(false);
        });
      } 
    });
  }
  
  function saveNewBoard(board){
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1) { // db connected
        let boardModel = new Board({
          board:board
        });
        boardModel.save(function(err, boardSaved){
          if (err){
            console.error(err);
            resolve(false);
          }
          (boardSaved) ? resolve(boardSaved) : resolve(false);
        });
      }
    });
  }
  
  function findThread(threadId){
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1){  // db connected
        Thread.findOne({ _id:threadId }, function(err, threadFound){
          if (err) {
            console.error(err);
            resolve(false);
          }
          (threadFound) ? resolve(threadFound) : resolve(false);
        });
      } 
    });
  }
  
  function saveNewThread(boardId, text, deletePassword, reported){
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1){ // db connected
        let currentDate = new Date();
        // console.log(boardId);
        // console.log(mongoose.Types.ObjectId(boardId));
        let threadModel = new Thread({
          board_id:mongoose.Types.ObjectId(boardId),
          text:text,
          created_on:currentDate,
          bumped_on:currentDate,
          delete_password:deletePassword,
          reported:reported
        });
        threadModel.save(function(err, threadSaved){
          if (err){
            console.error(err);
            resolve(false);
          }
          (threadSaved) ? resolve(threadSaved) : resolve(false);
        });
      }
    });
  }
  
  function saveNewReply(threadId, text, deletePassword, reported){
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1){ // db connected
        let currentDate = new Date();
        Thread.findOne({ _id:threadId }, function(err, threadFound){
          if (err) {
            console.error(err);
            resolve(false);
          }
          if (threadFound){
            let newReply = {
                text:text,
                created_on:currentDate,
                delete_password:deletePassword,
                reported:reported
                };
            (threadFound.replies === undefined) ? threadFound.replies = newReply : threadFound.replies.push(newReply);
            threadFound.bumped_on = currentDate;
            threadFound.save();
            // console.log(threadFound);
            resolve(threadFound);
          }
        });
      }
    });
  }
  
  function getAllReplies(board, threadId){
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1){ // connected
        //console.log([board, threadId]);
        Thread.aggregate([
                          {
                            '$lookup': {
                              'from': 'boards', 
                              'localField': 'board_id', 
                              'foreignField': '_id', 
                              'as': 'board_arr'
                            }
                          }, {
                            '$unwind': {
                              'path': '$board_arr'
                            }
                          }, {
                            '$project': {
                              'text': 1, 
                              'bumped_on': 1, 
                              'created_on': 1, 
                              'board_id': '$board_arr._id', 
                              'board': '$board_arr.board', 
                              'replies': 1
                            }
                          }, {
                            '$project': {
                              'text': 1, 
                              'bumped_on': 1, 
                              'created_on': 1, 
                              'board_id': 1, 
                              'board': 1, 
                              'replies': {
                                '_id': 1, 
                                'text': 1, 
                                'created_on': 1
                              }
                            }
                          }, {
                            '$match': {
                              'board': board,
                              '_id': mongoose.Types.ObjectId(threadId)
                            }
                          }, {
                            '$sort': {
                              'bumped_on': -1
                            }
                          }
                        ])
        .then(function(allThreads){
            (allThreads) ? resolve(allThreads) : resolve(false);
          });
      }
    });
  }
  
  function getLastThreads(board, threadLimit, replyLimit){
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1) { // connected
          Thread.aggregate([
                            {
                              '$lookup': {
                                'from': 'boards', 
                                'localField': 'board_id', 
                                'foreignField': '_id', 
                                'as': 'board_arr'
                              }
                            }, {
                              '$unwind': {
                                'path': '$board_arr'
                              }
                            }, {
                              '$project': {
                                'text': 1, 
                                'bumped_on': 1, 
                                'created_on': 1, 
                                'board_id': '$board_arr._id', 
                                'board': '$board_arr.board', 
                                'replies': {
                                  '$slice': [
                                    '$replies', replyLimit
                                  ]
                                }
                              }
                            }, {
                              '$project': {
                                'text': 1, 
                                'bumped_on': 1, 
                                'created_on': 1, 
                                'board_id': 1, 
                                'board': 1, 
                                'replies': {
                                  '_id': 1, 
                                  'text': 1, 
                                  'created_on': 1
                                }
                              }
                            }, {
                              '$match': {
                                'board': board
                              }
                            }, {
                              '$sort': {
                                'bumped_on': -1
                              }
                            }, {
                              '$limit': threadLimit
                            }
                          ])
          .then(function(lastThreads){
            (lastThreads) ? resolve(lastThreads) : resolve(false);
          });
      }
    });
  }

  
  
  // developer
  app.get("/developer", function (req, res) {
    res.json({
      "developer":"Leo Vargas",
      "company":"Magno Technologies"
    });
  }); 
  
  app.route('/api/threads/:board')   
  
    .get(function (req, res){
      var board = req.params.board;
      let getLastThreadsPromise = getLastThreads(board, 10, 3)
          .then(lastThreads => {
            res.json(lastThreads);
          });
    })
    
    .post(function (req, res){
      var board = req.params.board;
      var text = req.body.text;
      var deletePassword = req.body.delete_password;
      var reported = false;
    
      if (board.length == 0) {
        res.json("no board exists");
        return null;
      }
    
      //check if exists
      let findBoardPromise = findBoard(board)
	        .then(boardFound => {
            if (boardFound) {
              //create new thread
              let saveNewThreadPromise = saveNewThread(boardFound._id, text, deletePassword, reported)
              .then(newThreadSaved => {
                if (newThreadSaved) {
                  res.json({
                    _id:newThreadSaved._id,
                    text:newThreadSaved.text
                  });
                }
              });
            } else {
              // save new board
              let saveBoardPromise = saveNewBoard(board)
                .then(saved => {
                  // create new thread
                    let saveNewThreadPromise = saveNewThread(boardFound._id, text, deletePassword, reported)
                    .then(newThreadSaved => {
                      if (newThreadSaved) {
                        res.json({
                          _id:newThreadSaved._id,
                          text:newThreadSaved.text
                        });
                      }
                    });
                });
            }
	        });
    })
  
  .delete(function(req, res){
      //if successful response will be 'complete delete successful'
    var board = req.params.board;
    var thread_id = req.body.thread_id;
    var delete_password = req.body.delete_password;
    let findBoardPromise = findBoard(board)
        .then(boardFound => {
          if (boardFound) {
            // console.log([board, thread_id, delete_password]);
            Thread.deleteMany({ 
                       board_id:boardFound._id, 
                       _id:mongoose.Types.ObjectId(thread_id), 
                       delete_password:delete_password 
                  })
                  .then(deleted => {
                    // console.log(deleted);
                    (deleted.deletedCount) ? res.json('success') : res.json('incorrect password');
                });
          }
        });
    })
  
  .put(function(req, res){
    var board = req.params.board;
    // console.log(req.body);
    var thread_id = req.body.thread_id;
    // console.log(req.body);
    let findBoardPromise = findBoard(board)
        .then(boardFound => {
          if (boardFound) {
            // console.log(boardFound);
            Thread.findOne({ 
              board_id:boardFound._id, 
              _id:mongoose.Types.ObjectId(thread_id) 
             })
                  .then(found => {
                    if (found){
                      // console.log(found);
                      found.reported = true;
                      found.save();
                      res.json('success');
                    } else {
                      res.json('unknown thread id');
                    }
                });
          }
        });
    })
  
  ;

    
  app.route('/api/replies/:board')
  
    .get(function (req, res){
        var board = req.params.board;
        var threadId = req.body.thread_id || req.query.thread_id;
        // console.log([board, threadId])
        let getAllRepliesPromise = getAllReplies(board, threadId)
            .then(allReplies => {
              res.json(allReplies);
            });
      })
  
    .post(function (req, res){
      var board = req.params.board;
      var threadId = req.body.thread_id
      var text = req.body.text;
      var deletePassword = req.body.delete_password;
      var reported = false;
      // console.log(req.body);
      if (board.length == 0) {
        res.json("no board exists");
        return null;
      }

      //check if exists
      let findThreadPromise = findThread(threadId)
	        .then(threadFound => {
            if (threadFound) {
              let saveNewReplyPromise = saveNewReply(threadId, text, deletePassword, reported)
              .then(newReplySaved => {
                if (newReplySaved) {
                  // console.log(newReplySaved);
                  res.json(newReplySaved);
                }
              });
            }
	        });
    })
  
  .delete(function(req, res){
      //if successful response will be 'complete delete successful'
    var board = req.params.board;
    var thread_id = req.body.thread_id;
    var reply_id = req.body.reply_id;
    var delete_password = req.body.delete_password;
    // console.log(req.body);
    let findBoardPromise = findBoard(board)
        .then(boardFound => {
          if (boardFound) {
            // console.log(boardFound);
            Thread.findOne({ board_id:boardFound._id, 
                       _id:mongoose.Types.ObjectId(thread_id),
                       'replies._id': { $in: [reply_id] },
                       delete_password:delete_password})
            
                  .then(found => {
                    if (found){
                      //console.log(found);

                      let id = 0;
                      found.replies.map(function(reply, i){
                        if (reply._id.toString() == reply_id){
                          id = i;
                        }
                      });
                      found.replies[id].text = '[deleted]';
                      found.save();
                      res.json('success');
                    } else {
                      res.json('incorrect password')
                    }
                });
          }
        });
    })
  
    .put(function(req, res){
      //if successful response will be 'complete delete successful'
    var board = req.params.board;
    var thread_id = req.body.thread_id;
    var reply_id = req.body.reply_id;
    // console.log(req.body);
    let findBoardPromise = findBoard(board)
        .then(boardFound => {
          if (boardFound) {
            // console.log(boardFound);
            Thread.findOne({"replies": {$elemMatch: { "_id":mongoose.Types.ObjectId("5e66827c36f6dd03d95e70de")}}})
                  .then(found => {
                    // console.log(found);
                    if (found){
                      // console.log(found);
                      let id = 0;
                      found.replies.map(function(reply, i){
                        if (reply._id.toString() == reply_id){
                          id = i;
                        }
                      });
                      found.replies[id].reported = true;
                      found.save();
                      res.json('success');
                    } else {
                      res.json('unknown reply id')
                    }
                });
          }
        });
    })
  
  

};



/*

[
  {
    '$match': {
      'board_id': new ObjectId('5e62858b812c13533b127666')
    }
  }, {
    '$sort': {
      'bumped_on': -1
    }
  }, {
    '$limit': 10
  }, {
    '$project': {
      'board_id': 1, 
      'text': 1, 
      'created_on': 1, 
      'bumped_on': 1, 
      'replies': {
        '$slice': [
          '$replies', 3
        ]
      }
    }
  }
]

*/


/*
//including board
[
  {
    '$lookup': {
      'from': 'boards', 
      'localField': 'board_id', 
      'foreignField': '_id', 
      'as': 'board_arr'
    }
  }, {
    '$unwind': {
      'path': '$board_arr'
    }
  }, {
    '$project': {
      'text': 1, 
      'bumped_on': 1, 
      'created_on': 1, 
      'board_id': '$board_arr._id', 
      'board': '$board_arr.board', 
      'replies': {
        '$slice': [
          '$replies', 3
        ]
      }
    }
  }, {
    '$project': {
      'text': 1, 
      'bumped_on': 1, 
      'created_on': 1, 
      'board_id': 1, 
      'board': 1, 
      'replies': {
        '_id': 1, 
        'text': 1, 
        'created_on': 1
      }
    }
  }, {
    '$match': {
      'board': 'new-board'
    }
  }, {
    '$sort': {
      'bumped_on': -1
    }
  }, {
    '$limit': 10
  }
]

*/



/*

// all threads 

[
  {
    '$lookup': {
      'from': 'boards', 
      'localField': 'board_id', 
      'foreignField': '_id', 
      'as': 'board_arr'
    }
  }, {
    '$unwind': {
      'path': '$board_arr'
    }
  }, {
    '$project': {
      'text': 1, 
      'bumped_on': 1, 
      'created_on': 1, 
      'board_id': '$board_arr._id', 
      'board': '$board_arr.board', 
      'replies': 1
    }
  }, {
    '$project': {
      'text': 1, 
      'bumped_on': 1, 
      'created_on': 1, 
      'board_id': 1, 
      'board': 1, 
      'replies': {
        '_id': 1, 
        'text': 1, 
        'created_on': 1
      }
    }
  }, {
    '$match': {
      'board': 'new-board', 
      '_id': new ObjectId('5e6299c606407433464de57f')
    }
  }, {
    '$sort': {
      'bumped_on': -1
    }
  }
]

*/