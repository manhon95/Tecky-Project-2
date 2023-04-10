import { Request, Response } from "express";
import jsonfile from "jsonfile"
import path from "path";

export async function reportBugs(req: Request, res: Response) {
    let report = req.body.value
    console.log(report)
    await jsonfile.writeFile(path.join(__dirname, "bugReport.json"), report);
    res.json({message: "test"})
}
