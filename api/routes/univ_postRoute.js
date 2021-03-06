const express = require('express');
const router = express();
const connect = require('../../database/database');
const requestip = require('request-ip');

router.get('/post/:post_id', function (req, res) {
    var sql = `
        SELECT univ_post.*, user.user_nickname 
        FROM univ_post JOIN user ON univ_post.user_id=user.user_id 
        WHERE post_id=? AND post_isDeleted=0
    `;
    var params = [req.params.post_id];

    connect.query(sql, params, function (err, rows, fields) {
        if(req.session.user){
            let sql = `
                SELECT * FROM post_like WHERE user_id=? AND post_id=?
            `;
            let params = [req.session.user.user_id, req.params.post_id];
            connect.query(sql, params, function(err,resultrows, fields){
                if(err){
                    res.status(500).json({message:'error'});
                }else{
                    let result=[];
                    if(resultrows[0]){
                        result.push({
                            message:'success',
                            post_id:rows[0].post_id,
                            univ_id:rows[0].univ_id,
                            post_type:rows[0].post_type,
                            post_topic:rows[0].post_topic,
                            post_desc:rows[0].post_desc,
                            post_comment_count:rows[0].post_comment_count,
                            post_view_count:rows[0].post_view_count,
                            post_like_count:rows[0].post_like_count,
                            post_created:rows[0].post_created,
                            user_nickname:rows[0].user_nickname,
                            like:'on',
                        });
                    }else{
                        result.push({
                            message:'success',
                            post_id:rows[0].post_id,
                            univ_id:rows[0].univ_id,
                            post_type:rows[0].post_type,
                            post_topic:rows[0].post_topic,
                            post_desc:rows[0].post_desc,
                            post_comment_count:rows[0].post_comment_count,
                            post_view_count:rows[0].post_view_count,
                            post_like_count:rows[0].post_like_count,
                            post_created:rows[0].post_created,
                            user_nickname:rows[0].user_nickname,
                            like:'off',
                        });
                    }
                    res.json(result);
                }
            });
        }else{
            let result=[];
            result.push({
                message:'success',
                post_id:rows[0].post_id,
                univ_id:rows[0].univ_id,
                post_type:rows[0].post_type,
                post_topic:rows[0].post_topic,
                post_desc:rows[0].post_desc,
                post_comment_count:rows[0].post_comment_count,
                post_view_count:rows[0].post_view_count,
                post_like_count:rows[0].post_like_count,
                post_created:rows[0].post_created,
                user_nickname:rows[0].user_nickname,
                like:'off',
            });
            res.json(result);
        }
    });
});

router.get('/:univ_id/btpost', function (req, res) {
    var sql = `
        SELECT univ_post.*, user.user_nickname
        FROM univ_post 
        JOIN user ON univ_post.user_id=user.user_id 
        WHERE univ_id=? AND post_type=?
        ORDER BY post_created DESC
    `;
    var params = [req.params.univ_id, req.query.board_type];
    // console.log(req.query.startPostIndex, req.query.currentPostIndex);

    connect.query(sql, params, function (err, rows, fields) {
        let result = [];
        let likePost = [];
        if(req.session.user){
            let sql = `
                SELECT * FROM post_like WHERE user_id=?
            `;
            let params = [req.session.user.user_id];
            connect.query(sql,params,function(err, rows2, fields){
                for (let i = req.query.startPostIndex; i < req.query.currentPostIndex; i++) {
                    if(rows[i]){
                        let liked = 'off';
                        for(let j=0;j<rows2.length;j++){
                            if(rows[i].post_id===rows2[j].post_id){
                                liked='on';
                            }
                        }
                        rows[i] = {...rows[i], liked:liked}
                        result.push(rows[i]);
                    }else{
                        result.push(rows[i]);
                    }
                }
                res.send(result);
            });
        }else{
            for (let i = req.query.startPostIndex; i < req.query.currentPostIndex; i++) {
                if(rows[i]){
                    rows[i] = {...rows[i],liked:'off'};
                    result.push(rows[i]);
                }else{
                    result.push(rows[i]);
                }
            }
            res.send(result);
        }
    });
});

/**
 * 공지사항 포스터 3개만 가져와서 data에 푸쉬 한다.
 * 만약에 포스터 수가 3개 이하 일때는 undefined로 배열에 정리가 되며,
 * 클라이언트에서는 null로서 컨트롤 할수 있다.
 *  */

router.get('/:univ_id', function (req, res) {
    var startIndex = req.query.startIndex;
    var lastIndex = req.query.lastIndex;

    var sql = `
                SELECT univ_post.*, user.user_nickname 
                FROM univ_post JOIN user ON univ_post.user_id=user.user_id 
                WHERE univ_id=? AND post_type=?
                ORDER BY post_created DESC
            `;
    var params = [req.params.univ_id, req.query.boardType];
    var data = [];

    connect.query(sql, params, function (err, rows, fields) {
        for (let i = startIndex; i < lastIndex; i++) {
            data.push(rows[i]);
        }
        res.send(data);
    });
});

router.get('/:univ_id', function (req, res) {
    var sql = 'SELECT * FROM univ_post WHERE univ_id=?';
    var params = [req.params.univ_id];
    connect.query(sql, params, function (err, rows, fields) {
        console.log(rows);
    });
});

router.post('/writePost', function (req, res) {
    var sql = `INSERT INTO univ_post(univ_id, post_type, post_topic, post_desc, user_id)
                VALUES(?,?,?,?,?)
    `;
    var params = [req.body.univ_id, req.body.post_type, req.body.post_topic, req.body.post_desc, req.session.user.user_id];

    // const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
    // const ip = requestip.getClientIp(req);

    // console.log(ip);
    connect.query(sql, params, function (err, rows, fields) {
        if (err) {
            console.log(err);
        }
        if (rows.insertId) {
            res.status(201).json({ message: 'success' });
        } else {
            res.status(201).json({ message: 'failure' });
        }
    });

});

router.patch('/postCountPlus', function(req,res){
    let sql = `
        UPDATE univ_post SET post_view_count=post_view_count+1 WHERE post_id=?
    `;
    let params = [req.body.post_id];
    // console.log(req.body.post_id);
    connect.query(sql, params, function(err,rows, fields){
        res.json({message:'postCountUpdateOK'});
    })
})
module.exports = router;