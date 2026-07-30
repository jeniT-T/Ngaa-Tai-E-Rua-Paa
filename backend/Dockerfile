FROM node:20

# Backend image build context. Keep dependencies cached by copying package files first.
WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy the backend source after installing dependencies.
COPY . .

EXPOSE 4000
CMD ["npm", "run", "dev"]
