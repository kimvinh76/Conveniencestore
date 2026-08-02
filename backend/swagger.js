const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'DDBMS API',
    description: 'API Documentation for Distributed Database Management System',
  },
  host: 'localhost:3001',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Nhập token vào đây (ví dụ: Bearer <token>)'
    }
  }
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./src/app.js']; // Trỏ tới file gốc, công cụ sẽ tự động quét các require('./routes/...')

swaggerAutogen(outputFile, endpointsFiles, doc);
