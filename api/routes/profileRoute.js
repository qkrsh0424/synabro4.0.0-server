const express = require('express');
const router = express();
const cipher = require('../../handler/security');
const connect = require('../../database/database');

router.patch('/chguserinfo', function(req,res){
    // console.log(req.body.UID);
    // console.log(req.body.Email);
    // console.log(req.body.Name);
    // console.log(req.body.Nickname);
    // console.log(req.body.Job);
    // console.log(req.body.Major);
    // console.log(req.body.PW);

    // console.log('get uid : ', cipher.encrypt(req.body.UID));
    // console.log('uid : ', req.session.user.user_uid);
    let user_uid = cipher.encrypt(req.body.UID);
    if(req.session.user.user_uid===user_uid){
        let sql = `SELECT * FROM user WHERE user_id=?`;
        let params = [req.session.user.user_id];
        connect.query(sql, params, function(err, userInfo, fields){
            if(err){
                // console.log(err);
                res.json({message:'error'});
            }else{
                let salt = userInfo[0].user_salt;
                if(cipher.makeEncryptPassword(req.body.PW,salt)===userInfo[0].user_password){
                    let user_email = cipher.encrypt(req.body.Email);
                    let user_name = cipher.encrypt(req.body.Name);
                    let user_nickname = req.body.Nickname;
                    let user_job = req.body.Job;
                    let user_major = req.body.Major;
                    // console.log(user_email,user_name,user_nickname,user_job,user_major);
                    let sql = `
                        UPDATE user 
                        SET user_email=?, user_name=?, user_nickname=?, user_job=?, user_major=?
                        WHERE user_uid=?
                    `;
                    let params = [user_email,user_name,user_nickname,user_job,user_major,user_uid];

                    connect.query(sql, params, function(err,rows,fields){
                            if(err){
                                // console.log(err);
                                res.json({message:'error'});
                            }else{
                                if(rows.warningCount===0){
                                    req.session.user.user_nickname=user_nickname;
                                    res.status(200).json({message:'success'});
                                }else{
                                    res.json({message:'error'});
                                }
                            }
                    });


                }else{
                    res.json({message:'CHECKPW'});
                }
            }
        });
    }else{
        res.json({message:'error'});
    }
});

router.patch('/chgpassword',function(req,res){
    const getOldPassword = req.body.oldPassword;
    const getNewPassword = req.body.newPassword;
    const getUser_id = req.session.user.user_id;

    let sql = `
        SELECT * FROM user WHERE user_id=?
    `;
    let params = [getUser_id];

    connect.query(sql, params, function(err, userInfo, fields){
        if(err){
            res.status(500).json({message:'error'});
        }else{
            let salt = userInfo[0].user_salt;
            let getOldPasswordEncrypt = cipher.makeEncryptPassword(getOldPassword, salt);
            if(userInfo[0].user_password===getOldPasswordEncrypt){
                let newSalt = cipher.makeSalt();
                let setNewPassword = cipher.makeEncryptPassword(getNewPassword, newSalt);

                let sql = `
                    UPDATE user 
                    SET user_password=?, user_salt=?
                    WHERE user_id=?
                `;
                let params = [setNewPassword, newSalt, getUser_id];
                
                connect.query(sql, params, function(err, rows, fields){
                    if(err){
                        res.json({message:'error'});
                    }else{
                        if(rows.warningCount===0){
                            res.status(200).json({message:'success'});
                        }else{
                            res.json({message:'error'});
                        }
                    }
                });
            }else{
                res.status(200).json({message:'failure'});
            }
        }
    })

});

router.post('/dropuser',function(req,res){
    const getCurrentPassword = req.body.currentPassword;
    let sql = `
        SELECT * FROM user WHERE user_id=?
    `;
    let params = [req.session.user.user_id];
    connect.query(sql, params, function(err, userInfo, fields){
        if(err){
            res.status(500).json({message:'error'});
        }else{
            const salt = userInfo[0].user_salt;
            const getCurrentPasswordEncrypt = cipher.makeEncryptPassword(getCurrentPassword, salt);
            
            if(userInfo[0].user_password===getCurrentPasswordEncrypt){
                let sql = `DELETE FROM user WHERE user_id=?`;
                let params = [req.session.user.user_id];
                connect.query(sql, params, function(err,rows,fields){
                    if(rows.warningCount===0){
                        req.session.destroy();
                        res.status(201).json({message:'success'});
                    }else{
                        res.json({message:'error'});
                    }
                });
            }else{
                res.json({message:'failure'});
            }
        }
    });
})

module.exports = router;