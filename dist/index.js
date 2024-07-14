"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const MessagingResponse_1 = __importDefault(require("twilio/lib/twiml/MessagingResponse"));
// import twilio from "twilio";
const axios_1 = __importDefault(require("axios"));
const generative_ai_1 = require("@google/generative-ai");
var cors = require('cors');
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const geminiAPIKey = process.env.GEMINIAPIKEY;
const genAI = new generative_ai_1.GoogleGenerativeAI(geminiAPIKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// const accountSid = process.env.ACCOUNTID;
// const authToken = process.env.AUTHTOKEN;
// const MessagingResponse = twilio.twiml.MessagingResponse;
function getAirQuality(lat, lon) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = process.env.OPENWEATHERMAPAPI;
        const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        const response = yield axios_1.default.get(url);
        const airQulaityIndex = response.data.list[0].main.aqi;
        return airQulaityIndex;
    });
}
const prdeictHazard = (airQualityIndex) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = `The air qulaity index is ${airQualityIndex}. The AQI scale is from 1 to 5, where 1 is good and 5 is very poor. Predict the potential hazard level and provid safety advice.`;
    const result = yield model.generateContent(prompt);
    const response = yield result.response;
    const text = response.text();
    console.log(text);
    return text;
});
app.use(cors());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Express + Typescript Server');
});
app.post('/incoming', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { Latitude, Longitude, Body } = req.body;
    console.log(Latitude, Longitude);
    const airQulaity = yield getAirQuality(Latitude, Longitude);
    console.log("airQulaity", airQulaity);
    console.log(`Received message from ${Body}`);
    const alert = yield prdeictHazard(airQulaity);
    // console.log(`Air quality index in your place is ${airQulaityIndex}`);
    const twiml = new MessagingResponse_1.default();
    twiml.message(alert);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
}));
app.listen(port, () => {
    console.log('[Server]: Server is running at http://localhost:${port}');
});
