const express = require('express') ;
const cors = require(cors) ;

const bodyParser = require('body-parser') ;
const { default: OpenAI } = require('openai/index.mjs');
const multer = require('multer') ;

const fs = require('fs') ;
const PdfParse = require('pdf-parse');

const app = express() ;
const port = 5000;

//middleware covert data in js 
app.use(bodyParser.json()) ;
app.use(cors()) ;

//newly addded for file upload 
const upload = multer({dest : 'upload/'}) ;

const openai = new OpenAI({
    apiKey: '',
}) ;

app.post('/api/notes' , upload.single('file'), async (req, res) => {
    const {text} = req.body ;
    const file = req.file ;  // using multer

    try{
        let inputText = text ;

        if(file) {
            const filePath =  file.path ;

            if(file.mimetype === 'application/pdf'){
                const pdfBuffer = fs.readFileSync(filePath) ;
                const pdfData = await PdfParse(pdfBuffer) ;  // extract text
                inputText = pdfData.text ;
            }else{
                return res.status(400).json({error: 'only PDF files are supported '})
            }
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', 
            messages: [
            { role: 'system' , content: 'You are a helpful assistant and will generate the notes of given text in structured way'},
            { role: 'user' , content: inputText} ,    
            ],
        });

        fs.unlinkSync(file.path) ;

        res.json({notes: response.choices[0].message.content});
    } catch(error){
        console.error('Error proceesing request' , error) ;
        res.status(500).json({error : 'failed to process request'}) ;
    }
}) ;

app.listen(port , () => {
    console.log(`Server is running on http://localhost:${port}`);
});



