import { DocumentClient } from "aws-sdk/clients/dynamodb";
import express, { Request, Response, NextFunction } from "express";
import serverless from "serverless-http";
import { v4 as uuidv4 } from "uuid";
import {
    UserCreateSchema,
    UserSchema,
    UserEditSchema,
    UserResponse
} from './schemas/user/user-schema';
import {
    interParamsWithCondition,
    interParamsWithItens,
    interParamsWithKey,
    interParamsWithoutKey,
    interParamsWithValidations
} from "./interfaces/crud-interfaces";

const app = express();
const USERS_TABLE = process.env.USERS_TABLE;
const dynamoDbClient = new DocumentClient();

app.use(express.json());

app.post("/users", async (req: Request, res: Response): Promise<void> => {
    const parseResult = UserCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
        const errorMessages = parseResult.error.errors.map(err => ({
            message: err.message
        }));
        res.status(400).json({ errors: errorMessages });
        return;
    }

    const { name, email } = parseResult.data;

    const checkEmailParams: interParamsWithoutKey = {
        TableName: USERS_TABLE ?? '',
        FilterExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email }
    };

    try {
        const emailCheck = await dynamoDbClient.scan(checkEmailParams).promise();
        if (emailCheck.Count && emailCheck.Count > 0) {
            res.status(400).json({ error: "Esse e-mail já está registrado. Tente um e-mail diferente." });
            return;
        }
    } catch (error) {
        res.status(500).json({ error: "Ocorreu um erro ao verificar o e-mail. Tente novamente mais tarde." });
        return;
    }

    const userId = uuidv4();

    const params: interParamsWithItens = {
        TableName: USERS_TABLE ?? '',
        Item: {
            userId: userId,
            name: name,
            email: email
        }
    };

    try {
        await dynamoDbClient.put(params).promise();

        const response: UserResponse = { userId, name, email };

        const responseParseResult = UserSchema.safeParse(response);
        if (!responseParseResult.success) {
            res.status(500).json({ error: "Houve um problema ao criar o usuário. Tente novamente mais tarde." });
            return;
        }

        res.status(201).json(responseParseResult.data);
    } catch (error) {
        res.status(500).json({ error: "Não foi possível criar o usuário. Tente novamente mais tarde." });
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
            res.status(404).json({ error: 'Nenhum usuário encontrado.' });
        }
    } catch (error: any) {
        res.status(500).json({ error: "Ocorreu um erro ao buscar usuários. Tente novamente mais tarde." });
    }
});

app.get("/user-by-id/:userId", async (req: Request, res: Response): Promise<void> => {
    const params: interParamsWithKey = {
        TableName: USERS_TABLE ?? '',
        Key: {
            userId: req.params.userId,
        }
    };

    try {
        const { Item } = await dynamoDbClient.get(params).promise();
        if (Item) {
            const parseResult = UserSchema.safeParse(Item);
            if (!parseResult.success) {
                res.status(500).json({ error: "Erro na validação dos dados do usuário." });
                return;
            }
            res.json(parseResult.data);
        } else {
            res.status(404).json({ error: `Usuário não encontrado com o ID fornecido.` });
        }
    } catch (error) {
        res.status(500).json({ error: "Não foi possível retornar o usuário. Tente novamente mais tarde." });
    }
});

app.put("/user-edit/:userId", async (req: Request, res: Response): Promise<void> => {
    const parseResult = UserEditSchema.safeParse(req.body);
    if (!parseResult.success) {
        const errorMessages = parseResult.error.errors.map(err => ({
            message: err.message
        }));
        res.status(400).json({ errors: errorMessages });
        return;
    }

    const { userId } = req.params;
    const { name, email } = parseResult.data;

    const params: interParamsWithValidations = {
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
        const responseParseResult = UserSchema.safeParse(Attributes);
        if (!responseParseResult.success) {
            res.status(500).json({ error: "Erro na validação dos dados atualizados do usuário." });
            return;
        }
        res.json(responseParseResult.data);
    } catch (error) {
        res.status(500).json({ error: "Não foi possível atualizar o usuário. Tente novamente mais tarde." });
    }
});

app.delete("/user-delete/:userId", async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    const params: interParamsWithCondition = {
        TableName: USERS_TABLE ?? '',
        Key: {
            userId: userId
        },
        ConditionExpression: "attribute_exists(userId)"
    };

    try {
        await dynamoDbClient.delete(params).promise();
        res.json({ message: "Usuário deletado com sucesso!" });
    } catch (error: any) {
        if (error.code === 'ConditionalCheckFailedException') {
            res.status(404).json({ error: "Usuário não encontrado." });
        } else {
            res.status(500).json({ error: "Não foi possível deletar o usuário. Tente novamente mais tarde." });
        }
    }
});

app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        error: "Endpoint não encontrado. Verifique a URL e tente novamente.",
    });
});

export const handler = serverless(app);
