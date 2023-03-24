import { NextFunction, Request, Response } from "express";
import "./session-middleWare"

export function isLoggedIn(req: Request, res: Response, next: NextFunction){
    console.log("ok", req.session.user)
    if(req.session.user?.id){
        console.log("saved")

        next()
    }else{
        console.log("not saved")
        res.end("for admin only")
    }
}