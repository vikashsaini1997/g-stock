module.exports = {validation,validateAllFieldsRequests};

function validation(res, req, next, schema) {
    const options = {
        abortEarly: false, // include all errors
        allowUnknown: true, // ignore unknown props
        stripUnknown: true // remove unknown props
    };
    const { error, value } = schema.validate(req.body, options);
    
    if (error) {

        let message ="";
        let errorMessages = {};
   
        for(var i=0; i<error.details.length; i++){
            
            let errorData = {
                 "message" : error.details[i].message.replace(/[|&;$%@"<>()+,]/g, "")
             }; 
             let keyy = error.details[i].path[0];
             errorMessages[keyy] = errorData;
             if(i == 0)
             message = error.details[i].message.replace(/[|&;$%@"<>()+,]/g, "");
            // errorMessage.push(errorData);
        }
        return res.status(400).json({ status: false, status_code: 400,message :message});      
    } else {
        req.body = value;
        next();
    }
}
function validateAllFieldsRequests(res, req, next, schema){
    const options = {
        abortEarly: false, // include all errors
        allowUnknown: true, // ignore unknown props
        stripUnknown: true // remove unknown props
    };
    const { error, value } = schema.validate(req.body, options);

    if (error) {
        // console.log(error);
        let errorMessages = {};

        for (var i = 0; i < error.details.length; i++) {

            let errorData = {
                "message": error.details[i].message.replace(/[|&;$%@"<>()+,]/g, "")
            };
            let keyy = error.details[i].path[0];
            errorMessages[keyy] = errorData;
            // errorMessages.push(errorData);
        }
        return res.status(400).json({ errorMessage: errorMessages });
    } else {
        return req.body = value;
        //return res.status(200).json({ value: req.body }); 
    }
}