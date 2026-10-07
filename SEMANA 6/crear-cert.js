const fs = require("fs");
const selfsigned = require("selfsigned");

async function main() {
    const pems = await selfsigned.generate(
        [{ name: "commonName", value: "localhost" }],
        { days: 365, keySize: 2048 }
    );
    fs.mkdirSync("certs", { recursive: true });
    fs.writeFileSync("certs/key.pem", pems.private);
    fs.writeFileSync("certs/cert.pem", pems.cert);
    console.log("cert listo");
}

main();
