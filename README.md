# Customers Generator

## Description

Applications for generating customers and synchronization collections with anonymizing part of customers data.

<b>Application modes: </b>

<b>app</b> - generating customers and put in collection every 200 ms by batch 1-10 random length

<b>sync</b> - listening customers collection for update and insert operations, partial anonymizing customers documents and put it inside collection by batch not more 1000

<b>syncFull</b> - getting full collection, anonymizing data and put inside collection with anonymized customers

## Requirements

Node v.16.17.1

## Installation

1. `nano .env` and set actual mongodb uri
2. `npm i`
3. `npm run build"`

## Start Commands

- `npm run app` - starting generating customers application
- `npm run sync` - starting synchronization application [REAL TIME MODE]
- `npm run syncFull` - starting synchronization application [FULL SYNC MODE]

## Dev Commands

- `npm run lint` - formatting all applications code by prettier default
- `npm run build` - build application
