import express from 'express';
import { EyePop } from "@eyepop.ai/eyepop";
import process from 'process';
import { fetch } from 'node-fetch';

const activePort = process.env.PORT || 8080;

const INFER_STRING = "ep_infer id=1 category-name=\"text\" model=eyepop-text:EPTextB1_Text_TorchScriptCuda_float32 threshold=0.6 ! ep_infer id=2 category-name=\"text\" secondary-to-id=1 model=PARSeq:PARSeq_TextDataset_TorchScriptCuda_float32 threshold=0.1";

let POP_UUID = '';
let POP_API_SECRET = '';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.json());

app.post('/eyepop/set_credentials', async (request, res) =>
{
    try
    {
        POP_UUID = request.body.popId;
        POP_API_SECRET = request.body.secretKey;
        console.log('Credentials Set:', POP_UUID, POP_API_SECRET);

        console.log('Updating EyePop Models...');
        updatePopComp({ query: { popId: POP_UUID, popSecret: POP_API_SECRET, inferString: INFER_STRING } });


        res.send({ message: 'Authenticated' });

    } catch (error)
    {
        console.error('Error:', error);
        res.send({ error });
    }
});

let hasBeen30Minute = false;

app.get('/', (request, res) =>
{
    if (!hasBeen30Minute)
    {
        hasBeen30Minute = true;

        setTimeout(() =>
        {
            hasBeen30Minute = false;
            console.log('Updating EyePop Models...');
            updatePopComp({ query: { popId: POP_UUID, popSecret: POP_API_SECRET, inferString: INFER_STRING } });

        }, 1800000);
    }

    return res.html()
});

async function updatePopComp(request, res)
{
    const { popId, popSecret, inferString } = request.query;

    console.log('Updating EyePop Config:', popId, inferString);

    try
    {
        // Fetch the access token
        const authResponse = await fetch('https://staging-api.eyepop.ai/authentication/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret_key: popSecret })
        });
        const authData = await authResponse.json();

        console.log('Auth Data:', authData);
        const accessType = authData.token_type;
        const authToken = accessType + ' ' + authData.access_token;

        // Use the token to fetch current configuration
        const configResponse = await fetch(`https://staging-api.eyepop.ai/pops/${popId}/config?auto_start=True`, {
            headers: { 'Authorization': authToken }
        });

        const configData = await configResponse.json();

        console.log('Current Config:', configData);


        const currentModelSources = await fetch(configData.base_url + "/models/sources", {
            headers: { 'Authorization': authToken }
        });

        console.log('Current Model Sources:', await currentModelSources.text());

        const baseUrl = configData.base_url; // Dynamically use base_url from the config response
        const pipelineId = configData.pipeline_id; // Dynamically use pipeline_id from the config response

        console.log('Loading model sources:');

        let response = await fetch(baseUrl + "/models/sources", {
            method: "PUT",
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([
                { "authority": "legacy", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/legacy/1.2.0/manifest.json" },
                { "authority": "Mediapipe", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/Mediapipe/1.3.0/manifest.json" },
                { "authority": "yolov5", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/yolov5/1.0.2/manifest.json" },
                { "authority": "yolov7", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/yolov7/1.0.1/manifest.json" },
                { "authority": "yolov8", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/yolov8/1.0.1/manifest.json" },
                { "authority": "PARSeq", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/PARSeq/1.0.1/manifest.json" },
                { "authority": "mobilenet", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/mobilenet/1.0.1/manifest.json" },
                { "authority": "eyepop-person", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/epperson/1.0.2/manifest.json" },
                { "authority": "eyepop-animal", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/epanimal/1.0.2/manifest.json" },
                { "authority": "eyepop-device", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/epdevice/1.0.2/manifest.json" },
                { "authority": "eyepop-sports", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/epsports/1.0.2/manifest.json" },
                { "authority": "eyepop-vehicle", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/epvehicle/1.0.2/manifest.json" },
                { "authority": "eyepop-coco", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/epcoco/1.0.2/manifest.json" },
                { "authority": "eyepop-age", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/epage/0.2.0/manifest.json" },
                { "authority": "eyepop-gender", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/epgender/0.2.0/manifest.json" },
                { "authority": "eyepop-expression", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/epexpression/0.2.0/manifest.json" },
                { "authority": "PARSeq", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/PARSeq/1.0.2/manifest.json" },
                { "authority": "eyepop-text", "manifest": "https://s3.amazonaws.com/models.eyepop.ai/releases/eptext/1.0.3/manifest.json" },
            ])
        });

        console.log('Model sources loaded:', await response.text());

        console.log('Loading model PARSeq:');

        // Additional fetch calls
        response = await fetch(baseUrl + "/models/instances", {
            method: "POST",
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "model_id": "PARSeq:PARSeq",
                "dataset": "TextDataset",
                "format": "TorchScriptCuda",
                "type": "float32"
            })
        });

        console.log('Apply model 1:', await response.text());

        response = await fetch(baseUrl + "/models/instances", {
            method: "POST",
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "model_id": "eyepop-text:EPTextB1",
                "dataset": "Text",
                "format": "TorchScriptCuda",
                "type": "float32"
            })
        });

        console.log('Apply model 2:', await response.text());

        const updateData = await fetch(`${baseUrl}/pipelines/${pipelineId}/inferencePipeline`, {
            method: 'PATCH',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inferString: inferString })
        });

        console.log('Config updated:', await updateData.text());
    } catch (error)
    {
        console.error('Error:', error);
    }
}

app.get('/eyepop/session', async (request, res) =>
{
    console.log('Authenticating EyePop Session');
    // check if the request is from an authenticated user
    const isAuthenticated = req.headers.authorization;

    if (!isAuthenticated)
    {
        console.log('Unathorized Request');
    }

    try
    {

        const endpoint = await EyePop.endpoint(
            {
                popId: POP_UUID,
                auth: { secretKey: POP_API_SECRET }
            }).connect();

        let session = await endpoint.session();

        session = JSON.stringify(session);

        console.log('New EyePop Session:', session)

        res.send(session);

    } catch (error)
    {
        console.error('Error:', error);
        res.send({ error });
    }
});

app.listen(activePort, () =>
{
    console.log(`Server is running on port ${activePort}`);
});
