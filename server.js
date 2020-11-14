'use strict';
//Load dotenv
require('dotenv').config();
//dotenv vars
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const GEOIQ = process.env.GEOIQ;
const WEATHERQ = process.env.WEATHERQ;
//  Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const app = express();
// App setup
app.use(cors());
// Database Setup
const client = new pg.Client(DATABASE_URL);

//Routes
app.get('/', welcomePage);
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.use('*', errorHandler);

//constructors
function Location(city, locationData) {

  this.search_query = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
}
function Weather(city,weatherData) {
  this.search_query = city;
  this.forecast = weatherData.weather.description;
  this.time = weatherData.datetime;
}
// location handler
function locationHandler(req, res) {
  const location = 'SELECT * FROM location WHERE search_query=$1;';
  const city = req.query.city;
  const safrvar = [city];
  client.query(location, safrvar).then(result => {
    if (!(result.rowCount === 0)) {
      res.status(200).json(result.rows[0]);
    }
    else {

      //console.log('after catch');
      const url = `https://eu1.locationiq.com/v1/search.php?key=${GEOIQ}&q=${city}&format=json`;
      let locationArr;
      superagent.get(url).then(locationData => {
        //console.log(locationData.body);
        locationArr = new Location(city, locationData.body);
        const newValues = 'INSERT INTO location (search_query,formatted_query,latitude,longitude) VALUES($1,$2,$3,$4);';
        const saveValues = [locationArr.search_query, locationArr.formatted_query, locationArr.latitude, locationArr.longitude];
        //response.json(location);
        client.query(newValues, saveValues).then(() => {
          //console.log(saveValues);
          res.status(200).json(locationArr);
        });

      });
    }

  });


}
//weather handler
function weatherHandler(req, res) {
  const weatherdb = 'SELECT * FROM weather WHERE search_query=$1';
  const city = req.query.search_query;
  console.log(city);
  let lat = req.query.latitude;
  let lon = req.query.longitude;
  const safeVal = [city];
  client.query(weatherdb, safeVal).then(result => {
    if (!(result.rowCount === 0)) {
      res.status(200).json(result.rows[0]);
      console.log('from database');
    }
    else {
      const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${WEATHERQ}`;
      console.log('from api');
      superagent.get(url).then(weatherData => {
        console.log(weatherData.body);
        let weather;
        weather = weatherData.body.data.map(Data => {
          //console.log(Data);
          return new Weather(city,Data);

        });
        //console.log(weather);
        const newVal = 'INSERT INTO weather (search_query,forecast,time) VALUES($1,$2,$3);';
        const safeVal = [weather[0].search_query, weather[0].forecast, weather[0].time];
        client.query(newVal, safeVal).then(() => {
          //console.log(saveValues);
          res.status(200).json(weather);
        }).catch(console.error);
      });
    }
  });
}
// Handlers
// home
function welcomePage(req, res) {
  res.send('welcome to home');

}
//error
function errorHandler(req, res) {
  res.status(404).send('oooohhhh Not found ');
}
//listen
client.connect().then(() => {
  app.listen(PORT, () => console.log(`Listening to port${PORT}`));
}).catch(error => {
  console.log('error', error);
});


