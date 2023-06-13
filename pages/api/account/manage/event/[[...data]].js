import { authOptions } from "../../../auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "bson";

import connectMongo from "@config/mongo";
import logger from "@config/logger";
import Profile from "@models/Profile";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ message: "You must be logged in." });
    return;
  }
  const username = session.username;
  if (!["GET", "PUT"].includes(req.method)) {
    return res
      .status(400)
      .json({ error: "Invalid request: GET or PUT required" });
  }

  const { data } = req.query;
  let event = {};
  if (req.method === "GET") {
    event = await getEventApi(username, data[0]);
  }
  if (req.method === "PUT") {
    if (data?.length && data[0]) {
      event = await updateEventApi(username, data[0], req.body);
    } else {
      event = await addEventApi(username, req.body);
    }
  }

  if (event.error) {
    return res.status(404).json({ message: event.error });
  }
  return res.status(200).json(event);
}

export async function getEventApi(username, id) {
  await connectMongo();
  const log = logger.child({ username });
  const getEvent = await Profile.aggregate([
    {
      $match: {
        username,
      },
    },
    {
      $unwind: "$events",
    },
    {
      $match: {
        "events._id": new ObjectId(id),
      },
    },
    {
      $replaceRoot: {
        newRoot: "$events",
      },
    },
  ]);

  if (!getEvent) {
    log.info(`event not found for username: ${username}`);
    return { error: "Event not found." };
  }

  return JSON.parse(JSON.stringify(getEvent[0]));
}

export async function updateEventApi(username, id, event) {
  await connectMongo();
  const log = logger.child({ username });

  let getEvent = {};
  try {
    getEvent = await Profile.findOneAndUpdate(
      {
        username,
        "events._id": new ObjectId(id),
      },
      {
        $set: {
          "events.$": event,
        },
      },
      { upsert: true }
    );
  } catch (e) {
    log.error(e, `failed to update event for username: ${username}`);
  }

  return JSON.parse(JSON.stringify(getEvent));
}

export async function addEventApi(username, event) {
  await connectMongo();
  const log = logger.child({ username });
  let getEvent = {};
  try {
    getEvent = await Profile.findOneAndUpdate(
      {
        username,
      },
      {
        $push: { events: event },
      },
      { upsert: true }
    );
  } catch (e) {
    log.error(e, `failed to update event for username: ${username}`);
  }

  return JSON.parse(JSON.stringify(getEvent));
}
