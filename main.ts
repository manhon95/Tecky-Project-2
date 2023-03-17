import express, { Request, Response } from 'express'
import {saveUserDetails} from "./manageUserAccount"
import {print} from "listening-on"
//  import {}
let app = express()

app.use(express.static("public"))
app.use(express.urlencoded())


app.post("/contact", (req,res)=>{
 saveUserDetails(req, res)
   res.end("done")
})

app.get("/submit" )
const PORT = 8080
app.listen(PORT, () => {
 print(PORT)
})
