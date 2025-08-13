// lib/neo4j.ts
import neo4j from "neo4j-driver";
import { config } from "./config";

let driver = null;

export async function getNeo4jDriver() {
  if (driver) return driver;

  const uri = config.neo4j.uri;         
  const user = config.neo4j.user;
  const password = config.neo4j.password;

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 5000,
  });

  // Will throw if creds/URI are wrong or no permission
  await driver.verifyConnectivity();
  console.log("Neo4j connectivity verified");
  return driver;
}

export async function closeDatabaseConnection() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export async function testConnection() {
  const d = await getNeo4jDriver();                  
  const session = d.session({ database: process.env.NEO4J_DATABASE || "neo4j" });
  try {
    await session.run("RETURN 1 AS test");
    console.log("Successfully connected to Neo4j");
    return true;
  } catch (e) {
    console.error("Failed to connect to Neo4j:", e);
    return false;
  } finally {
    await session.close();
  }
}
