import AWS from "aws-sdk"
import express from "express"
import serverless from "serverless-http"

const app = express()
const USERS_TABLE = process.env.USERS_TABLE
const dynamoDbClient = new AWS.DynamoDB.DocumentClient()

app.use(express.json())

app.get("/user-by-id/:userId", async (req, res) => {
    const params = {
        TableName: USERS_TABLE,
        Key: {
            userId: req.params.userId,
        }
    }

try{
    const {Item} = await dynamoDbClient.get(params).promise();
    if(Item){
        const {userId, name} = Item;
        res.json({userId, name});
    }else{
        res
        .status(404)
        .json({error:'Usuário não encontrado com "userId'})
    }
}catch(error){
    console.log(error);
    res.status(500).json({error: "Não foi possível retornar o usuário"});
}
});

app.get("/users", async (_, res) => {
    const params = {
        TableName: USERS_TABLE,
    }
try{
    const data = await dynamoDbClient.scan(params).promise();
    if(data.Items){
        res.json(data.Items);
    }else{
        res
        .status(404)
        .json({error:'Usuários não encontrados'})
    }
}catch(error){
    console.log(error);
    res.status(500).json({error: error});
}
});

app.put("/user-edit/:userId", async (req, res) => {
    const { userId } = req.params; 
    const { name, email } = req.body; 

    
    const params = {
        TableName: USERS_TABLE,
        Key: {
            userId: userId
        },
        UpdateExpression: "set #name = :name, email = :email", 
        ConditionExpression: "attribute_exists(userId)",
        ExpressionAttributeNames: {
            "#name": "name" 
        },
        ExpressionAttributeValues: {
            ":name": name,
            ":email": email
        },
        ReturnValues: "ALL_NEW" 
    };

    try {
        const { Attributes } = await dynamoDbClient.update(params).promise();
        res.json(Attributes); 
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Não foi possível atualizar o usuário" });
    }
});


app.post("/users", async (req, res)=>{
    const {userId, name, email} = req.body;

    const params ={
        TableName: USERS_TABLE,
        Item:{
            userId: userId,
            name: name,
            email: email
        }
    }

    try {
        await dynamoDbClient.put(params).promise();
        return res.json({userId, name, email});
    }catch(error){
        console.log(error);
        return res.status(500).json({error: "Não foi possível criar o usuário"})
    }
});

app.delete("/user-delete/:userId", async (req, res) => {
    const { userId } = req.params; 

    const params = {
        TableName: USERS_TABLE,
        Key: {
            userId: userId
        },
        ConditionExpression: "attribute_exists(userId)" 
    };

    try {
        await dynamoDbClient.delete(params).promise();
        res.json({ message: "Usuário deletado!" });
    } catch (error) {
        if (error.code === 'ConditionalCheckFailedException') {
            res.status(404).json({ error: "Usuário não encontrado" });
        } else {
            console.log(error);
            res.status(500).json({ error: "Não foi possível deletar o usuário" });
        }
    }
});


app.use((req, res, next) => {
    return res.status(404).json({
        error: "Não encontrado",
    })
})

export const handler = serverless(app);