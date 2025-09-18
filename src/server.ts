// import app from './app';
// import config from './app/config';
// import mongoose from 'mongoose';
// import http from 'http';

// async function main() {
//   try {
//     await mongoose.connect(config.database_url as string);

//     const server = http.createServer(app);

//     // ⏱️ Set timeout to 1 hour (3600000 ms)
//     server.timeout = 60 * 60 * 1000;

//     app.listen(config.port, () => {
//       console.log(`Example app listening on PORT === ${config.port}`);
//     });
//   } catch (error) {
//     console.log(error);
//   }
// }
// main();


import app from './app';
import config from './app/config';
import mongoose from 'mongoose';
import http from 'http';

async function main() {
  try {
    await mongoose.connect(config.database_url as string);

    const server = http.createServer(app);

    // ⏱️ Set timeout to 1 hour (3600000 ms)
    server.timeout = 60 * 60 * 1000;

    const port = process.env.PORT || config.port || 8000

    server.listen(port, () => {
      console.log(`Example app listening on PORT === ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();
