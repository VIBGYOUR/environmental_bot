import express, {Express,Request,Response} from "express";
import dotenv from "dotenv";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";
// import twilio from "twilio";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
var cors = require('cors');

dotenv.config();

const app : Express = express();
const port = process.env.PORT;

const geminiAPIKey = process.env.GEMINIAPIKEY as string;
const genAI = new GoogleGenerativeAI(geminiAPIKey);
const  model = genAI.getGenerativeModel({model:"gemini-1.5-flash"});
// const accountSid = process.env.ACCOUNTID;
// const authToken = process.env.AUTHTOKEN;
// const MessagingResponse = twilio.twiml.MessagingResponse;

async function getAirQuality(lat: number, lon:number){
    const apiKey = process.env.OPENWEATHERMAPAPI;
    const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const response = await axios.get(url);
    const airQulaityIndex = response.data.list[0].main.aqi;
    return airQulaityIndex;
}

const prdeictHazard = async (airQualityIndex: number)=>{
    const prompt = `The air qulaity index is ${airQualityIndex}. The AQI scale is from 1 to 5, where 1 is good and 5 is very poor. Predict the potential hazard level and provid safety advice.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
    return text;
}

app.use(cors());
app.use(express.urlencoded({extended:false}));
app.use(express.json());


app.get('/',(req:Request,res:Response)=>{
    res.send('Express + Typescript Server');
});


app.post('/incoming',async (req,res)=>{
    const {Latitude,Longitude,Body} = req.body;

    console.log(Latitude,Longitude);
    const airQulaity = await getAirQuality(Latitude,Longitude);

    console.log("airQulaity",airQulaity);
    console.log(`Received message from ${Body}`);

    const alert = await prdeictHazard(airQulaity);

    // console.log(`Air quality index in your place is ${airQulaityIndex}`);
    const twiml = new MessagingResponse();
    twiml.message(alert);
    res.writeHead(200,{'Content-Type':'text/xml'});
    res.end(twiml.toString());
})

app.listen(port,()=>{
    console.log('[Server]: Server is running at http://localhost:${port}');
});