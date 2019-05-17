"use strict";

const express = require("express");

function Service(port) {
    this.app = express();
    this.port = port || 80;
}

Service.prototype.start = function () {
    this.app.get("/", (__, res) => res.send("Hello World!"));
    this.app.listen(this.port, () => console.log(`Service listening on port ${this.port}`));
};

module.exports = Service;

