# E-Voting apps using blockchain
Undergraduate Thesis Research of Tryo Asnafi 


## Tools and Language use
1. Hardhat
2. Solidity
3. TypeScript
4. Next.js
5. Firebase Firestore


## Prerequisite
1. Firebase API KEY, you need to make new firebase project


## How to Run
1. Clone the repository
2. Open folder backend
```sh
cd backend
npm install
npx hardhat clean
npm run node
```
3. Open another terminal
```sh
npm run compile
npm run deploy
```
4. Open folder frontend
```sh
cd frontend
```
5. Copy `.env.example` to `.env`
```sh
cp .env.example .env
``` 
6. Fill env with your Firebase config
7. Run development server
```sh
npm run dev
```
8. Open `localhost:3000` in your browser