import { NextFunction, Request, Response } from "express";
import "./session-middleWare"

export function isLoggedIn(req: Request, res: Response, next: NextFunction){
    console.log("ok", req.session.user)
    if(req.session.user?.id){

        next()
    }else{
        res.end("for admin only")
    }
}