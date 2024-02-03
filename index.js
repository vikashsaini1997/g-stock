require('dotenv').config();
const express = require("express");
const app = express();
const cors = require('cors')
const morgan = require('morgan')
const multer = require('multer')
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require('path')
const PORT = process.env.PORT || 3010;
const cron = require("./service/cron.service")

app.use(cors({
    origin: '*'
}));

//front
const userRoutes = require('./front/routes/user.router')


//admin
const useradminRoutes = require('./admin/router/user.router')

//cron shedule//
cron.planexpirycheck();
app.use(morgan('dev'))
app.use(express.json()) //json allow
app.use(express.urlencoded({ extended: true })) //json allow
app.use('/uploads', express.static(path.join(__dirname, '/uploads')))
app.use('/csv_report', express.static(path.join(__dirname, '/csv_report')))


//front
app.use('/app/users', userRoutes); //user route

//admin
app.use('/admin', useradminRoutes) //user router



const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Gradstock Backend",
            version: "2.0.0",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    name: "Authorization",
                    in: "header",
                }
            }
        }
    },
    apis: ['./swager_routes/**/*.yaml'],
};
const specs = swaggerJsdoc(options);
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, { explorer: true })
);


app.listen(PORT, () => console.log(`Server running on ${PORT}`))
