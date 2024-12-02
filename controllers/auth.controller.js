const express=require('express');
const md5=require('md5');

const jwt=require('jsonwebtoken');
const userModel=require('../models/index').user;
const hash=require('md5');

const autenticate=async(request,response,next)=>{
    let dataLogin={
        username:request.body.username,
        password:hash(request.body.password)
    }
    let dataUser=await userModel.findOne({where:dataLogin});
    if(dataUser){
        let payload=JSON.stringify(dataUser);
        let secret='Mokleters'
        let token=jwt.sign(payload,secret);
        response.json({
            success: true,
            message: 'Welcome back!',
            token:token,
            // data:dataUser
        });
    } 
    else {
        return response.json({
            success:false,
            logged:false,
            message:'Invalid login!'
        });
    }
}

const authorize=(request,response,next)=>{
    let header = request.headers.authorization;
    let tokenKey = header && header.split(' ')[1];

    if(tokenKey==null){
        return response.json({
            success:false,
            message:'Unauthorized User!'
        });
    }

    let secret='Mokleters';

    jwt.verify(tokenKey, secret, (error, user) => {
        if(error){
            return response.json({
                success:false,
                message:'Invalid token!',
                token: tokenKey
            });
        }
    })
    next();
}
module.exports={ autenticate,authorize };