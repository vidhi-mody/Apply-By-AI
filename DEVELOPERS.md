# Setting up and running the app on your machine

This document describes how to set up your development environment to run and test Apply-by-AI.
It also explains the basic mechanics of using `git`, `node`.

* [Prerequisite Software](#prerequisite-software)
* [Getting the Sources](#getting-the-sources)
* [Installing NPM Modules](#installing-npm-modules)
* [Spinnng up the Database](#spinnng-up-the-database)
* [Setting up environment variables](#setting-up-the-environment-variables)
* [Starting the server](#starting-the-server)

## Prerequisite Software

Before you can run and test Apply-by-AI, you must install and configure the
following products on your development machine:

* [Git](http://git-scm.com) and/or the **GitHub app** (for [Mac](http://mac.github.com) or
  [Windows](http://windows.github.com)); [GitHub's Guide to Installing
  Git](https://help.github.com/articles/set-up-git) is a good source of information.
* [Node.js](http://nodejs.org), (version specified in the engines field of [`package.json`](../package.json)) which is used to run a development web server,
  run tests, and generate distributable files.
* [MongoDB](https://docs.mongodb.com/manual/installation/) which is used as a NoSQL database.

## Getting the Sources

Fork and clone the repository:

1. Login to your GitHub account or create one by following the instructions given
   [here](https://github.com/signup/free).
2. [Fork](http://help.github.com/forking) the [main repository](https://github.com/und3fined-v01d/apply-by-ai).
3. Clone your fork of the repository and define an `upstream` remote pointing back to
   the Apply-by-AI repository that you forked in the first place.

```shell
# Clone your GitHub repository:
git clone git@github.com:<github username>/apply-by-ai.git

# Go to the Apply-by-AI directory:
cd apply-by-ai

# Add the main repository as an upstream remote to your repository:
git remote add upstream https://github.com/und3fined-v01d/apply-by-ai.git
```

## Installing NPM Modules

Next, install the JavaScript modules needed to build and test Angular:

```shell
# Install project dependencies (package.json)
npm ci
```

## Spinnng up the Database

Assuming that you already have your MongoDB database installed, spin up the mongo daemon

```shell
mongod
```

## Setting up environment variables

You need to set up Google clientId, secret and callback url in order to work with Google login.
Ref: https://developers.google.com/identity/protocols/oauth2

```shell
cp .env.template .env
```

## Starting the server

```
npm run dev
```
