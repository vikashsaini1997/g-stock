const fs = require('fs');
var path = require('path');
const fastcsv = require('fast-csv');
const db = require("../models");

const reportdownload = async(slug,filter,startdate,enddate ,Filename) => {

    const startDate = new Date(startdate);
    const endDate = new Date(enddate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if(slug == "expert"){
    const expertList = await db.User.findAll({
        attributes: { exclude: ['auth_token', 'password'] },
        where: {
          role_id:3,
          status:filter == 1 ? [1,2]:filter,
          createdAt: {
            [db.Sequelize.Op.between]: [startDate, endDate],
          },
        },
      });
    
      var csvData = expertList.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      }));
    }else if(slug = "buyer"){
        const buyerList = await db.User.findAll({
            attributes: { exclude: ['auth_token', 'password'] },
            where: {
              role_id:2,
              status:[1,2],
              createdAt: {
                [db.Sequelize.Op.between]: [startDate, endDate],
              },
            },
          });
        
          var csvData = buyerList.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            status: user.status,
          }));
    }

      const csvFilename = Filename
      const csvOptions = { headers: true, delimiter: ',' };
      const Directory = 'uploads/csv_report';
      const uploadDirectory = path.join(__dirname, "../uploads/csv_report");
      const csvFilePath = path.join(uploadDirectory, csvFilename);
    
      if (!fs.existsSync(uploadDirectory)) {
        fs.mkdirSync(uploadDirectory, { recursive: true });
      }
    
      await fastcsv.writeToPath(csvFilePath, csvData, csvOptions);
      const relativeUrl = `/${Directory}/${csvFilename}`;
      return relativeUrl;
}



module.exports = { reportdownload};