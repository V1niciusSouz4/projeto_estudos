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
exports.handler = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const express_1 = __importDefault(require("express"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const app = (0, express_1.default)();
const USERS_TABLE = process.env.USERS_TABLE;
const dynamoDbClient = new aws_sdk_1.default.DynamoDB.DocumentClient();
app.use(express_1.default.json());
app.get("/user-by-id/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: USERS_TABLE !== null && USERS_TABLE !== void 0 ? USERS_TABLE : '',
        Key: {
            userId: req.params.userId,
        }
    };
    try {
        const { Item } = yield dynamoDbClient.get(params).promise();
        if (Item) {
            const { userId, name } = Item;
            res.json({ userId, name });
        }
        else {
            res.status(404).json({ error: 'Usuário não encontrado com "userId"' });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Não foi possível retornar o usuário" });
    }
}));
app.get("/users", (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: USERS_TABLE !== null && USERS_TABLE !== void 0 ? USERS_TABLE : '',
    };
    try {
        const data = yield dynamoDbClient.scan(params).promise();
        if (data.Items) {
            res.json(data.Items);
        }
        else {
            res.status(404).json({ error: 'Usuários não encontrados' });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
}));
app.put("/user-edit/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { name, email } = req.body;
    const params = {
        TableName: USERS_TABLE !== null && USERS_TABLE !== void 0 ? USERS_TABLE : '',
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
        const { Attributes } = yield dynamoDbClient.update(params).promise();
        res.json(Attributes);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Não foi possível atualizar o usuário" });
    }
}));
app.post("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, name, email } = req.body;
    const params = {
        TableName: USERS_TABLE !== null && USERS_TABLE !== void 0 ? USERS_TABLE : '',
        Item: {
            userId: userId,
            name: name,
            email: email
        }
    };
    try {
        yield dynamoDbClient.put(params).promise();
        return res.json({ userId, name, email });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Não foi possível criar o usuário" });
    }
}));
app.delete("/user-delete/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const params = {
        TableName: USERS_TABLE !== null && USERS_TABLE !== void 0 ? USERS_TABLE : '',
        Key: {
            userId: userId
        },
        ConditionExpression: "attribute_exists(userId)"
    };
    try {
        yield dynamoDbClient.delete(params).promise();
        res.json({ message: "Usuário deletado!" });
    }
    catch (error) {
        if (error.code === 'ConditionalCheckFailedException') {
            res.status(404).json({ error: "Usuário não encontrado" });
        }
        else {
            console.log(error);
            res.status(500).json({ error: "Não foi possível deletar o usuário" });
        }
    }
}));
app.use((_, res, next) => {
    return res.status(404).json({
        error: "Não encontrado",
    });
});
exports.handler = (0, serverless_http_1.default)(app);
