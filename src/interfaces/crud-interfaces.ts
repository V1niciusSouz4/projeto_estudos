export interface interParamsWithKey {
    TableName: string;
    Key: {
        userId: string;
    };
}

export interface interParamsWithoutKey {
    TableName: string;
    FilterExpression?: string;
    ExpressionAttributeValues?: {
        [key: string]: any;
    };
}

export interface interParamsWithValidations extends interParamsWithKey {
    UpdateExpression: string;
    ConditionExpression: string;
    ExpressionAttributeNames: {
        [key: string]: string;
    };
    ExpressionAttributeValues: {
        [key: string]: any;
    };
    ReturnValues: string;
}

export interface interParamsWithItens {
    TableName: string;
    Item: {
        userId: string;
        name: string;
        email: string;
    };
}

export interface interParamsWithCondition extends interParamsWithKey {
    ConditionExpression: string;
}
