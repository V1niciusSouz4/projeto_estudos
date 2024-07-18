import { DocumentClient } from "aws-sdk/clients/dynamodb";
import express, { Request, Response, NextFunction } from "express";
import serverless from "serverless-http";
import { interParamsWithCondition, interParamsWithItens, interParamsWithKey, interParamsWithoutKey, interParamsWithValidations } from "./interfaces/crud-interfaces";

const app = express();
const USERS_TABLE = process.env.USERS_TABLE;
const dynamoDbClient = new DocumentClient();

app.use(express.json());

app.post("/users", async (req: Request, res: Response):Promise<void>=>{
    const {userId, name, email} = req.body;

    const params:interParamsWithItens ={
        TableName: USERS_TABLE?? '',
        Item:{
            userId: userId,
            name: name,
            email: email
        }
    }

    try {
        await dynamoDbClient.put(params).promise();
        res.json({userId, name, email});
    }catch(error){
        console.log(error);
        res.status(500).json({error: "Não foi possível criar o usuário"})
    }
});

app.get("/users", async (_: Request, res: Response): Promise<void> => {
    const params: interParamsWithoutKey = {
        TableName: USERS_TABLE ?? '',
    };
    try {
        const data = await dynamoDbClient.scan(params).promise();
        if (data.Items) {
            res.json(data.Items);
        } else {
            res.status(404).json({ error: 'Usuários não encontrados' });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/user-by-id/:userId", async (req: Request, res: Response): Promise<void> => {
    const params:interParamsWithKey = {
        TableName: USERS_TABLE ?? '',
        Key: {
            userId: req.params.userId,
        }
    }

try{
    const {Item} = await dynamoDbClient.get(params).promise();
    if(Item){
        const {userId, name, email} = Item;
        res.json({userId, name, email});
    }else{
        res
        .status(404)
        .json({error:`Usuário não encontrado com id fornecido`})
    }
}catch(error){
    res.status(500).json({error: "Não foi possível retornar o usuário"});
}
});

app.put("/user-edit/:userId", async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params; 
    const { name, email } = req.body; 

    
    const params:interParamsWithValidations = {
        TableName: USERS_TABLE ?? '',
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

app.delete("/user-delete/:userId", async (req, res): Promise<void> => {
    const { userId } = req.params; 

    const params:interParamsWithCondition = {
        TableName: USERS_TABLE ?? '',
        Key: {
            userId: userId
        },
        ConditionExpression: "attribute_exists(userId)" 
    };

    try {
        await dynamoDbClient.delete(params).promise();
        res.json({ message: "Usuário deletado!" });
    } catch (error:any) {
        if (error.code === 'ConditionalCheckFailedException') {
            res.status(404).json({ error: "Usuário não encontrado" });
        } else {
            console.log(error);
            res.status(500).json({ error: "Não foi possível deletar o usuário" });
        }
    }
});

app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        error: "Não encontrado",
    });
});

export const handler = serverless(app);