PARFUME STORE --> https://backend-assignment4-t29x.onrender.com/


TO SIGN UP AS ADMIN:
1. Input login: admin@gmail.com
2. Input Password: admin


FOR CREATE ACCOUND:
1. Input Name
2. Input Login
3. If you want to be admin input in Role fill (admin
4. You can generate password or input your own password



IN ADMIN PAGE:
1. You can delete exist users
2. You can add new parfume for shop
   For add new parfume:
   1. Write name of parfum
   2. enter who this perfume is for male or female
   3. enter price of parfum
   4. press add btn
   After this manipulations new parfume will display on admin page and users page




IN USERS PAGE: 
You can see parfumes, carousel of parfumes and two btns (forher and forhim)
After press on forher or forhim button you you will be redirected to the corresponding page, where perfumes corresponding to gender are shown.



USED API(Generating password and World Time) --->

---> GENERATING PASSWORD API {
app.get('/generatePassword', (req, res) => {
    const length = 10;
    const apiUrl = `https://api.api-ninjas.com/v1/passwordgenerator?length=${length}`;
    
    request.get({ url: apiUrl, headers: { 'X-Api-Key': 'zCiu/SIh1DDgLodOdcw3WA==OYVqYLWc7uA1WSgn' } }, (error, response, body) => {
      if (error) {
        console.error('Request failed:', error);
        res.status(500).send('Error generating password');
      } else if (response.statusCode !== 200) {
        console.error('Error:', response.statusCode, body.toString('utf8'));
        res.status(response.statusCode).send('Error generating password');
      } else {
        const generatedPassword = body.trim();
        res.send(generatedPassword);
      }
    });
  });
}


WORLD TIME API: {


app.get('/main', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const city = 'Almaty'; 
        const apiUrl = 'https://api.api-ninjas.com/v1/worldtime?city=' + city;
        const apiKey = 'zCiu/SIh1DDgLodOdcw3WA==OYVqYLWc7uA1WSgn'; 

        // Make the request
        request.get({ url: apiUrl, headers: { 'X-Api-Key': apiKey } }, function (error, response, body) {
            if (error) {
                console.error('Request failed:', error);
                res.status(500).send('Error fetching world time data');
            } else if (response.statusCode !== 200) {
                console.error('Error:', response.statusCode, body.toString('utf8'));
                res.status(response.statusCode).send('Error fetching world time data');
            } else {
                const worldTimeData = JSON.parse(body);
                res.render('main', {
                    username: user.username,
                    worldTime: worldTimeData,
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching user data');
    }
});
}



