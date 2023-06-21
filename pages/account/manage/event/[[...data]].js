import { useState } from "react";
import { authOptions } from "../../../api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import logger from "@config/logger";
import PageHead from "@components/PageHead";
import Page from "@components/Page";
import Button from "@components/Button";
import Navigation from "@components/account/manage/navigation";
import { getEventApi } from "pages/api/account/manage/event/[[...data]]";
import Input from "@components/form/Input";
import EventCard from "@components/event/EventCard";
import Toggle from "@components/form/Toggle";
import Notification from "@components/Notification";

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }

  const username = session.username;
  const id = context.query.data ? context.query.data[0] : undefined;
  let event = {};
  if (id) {
    try {
      event = await getEventApi(username, id);
    } catch (e) {
      logger.error(e, `event failed for username: ${username}`);
    }
  }

  return {
    props: { event, BASE_URL: process.env.NEXT_PUBLIC_BASE_URL },
  };
}

export default function ManageEvent({ BASE_URL, event }) {
  const [showNotification, setShowNotification] = useState({
    show: false,
    type: "",
    message: "",
    additionalMessage: "",
  });
  const [isVirtual, setIsVirtual] = useState(event.isVirtual || true);
  const [name, setName] = useState(event.name || "Official name of the Event");
  const [description, setDescription] = useState(
    event.description || "Description of the event from their website"
  );
  const [url, setUrl] = useState(event.url || "");
  const [startDate, setStartDate] = useState(event.date?.start);
  const [endDate, setEndDate] = useState(event.date?.end);
  const [price, setPrice] = useState(event.price);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let putEvent = {
      name,
      description,
      url,
      date: { start: startDate, end: endDate },
      isVirtual,
      price,
      order: event.order,
    };
    let apiUrl = `${BASE_URL}/api/account/manage/event/`;
    if (event._id) {
      putEvent = { ...putEvent, _id: event._id };
      apiUrl = `${BASE_URL}/api/account/manage/event/${event._id}`;
    }
    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(putEvent),
    });
    const update = await res.json();

    if (update.message) {
      return setShowNotification({
        show: true,
        type: "error",
        message: "Event add/update failed",
        additionalMessage: `Please check the fields: ${Object.keys(
          update.message
        ).join(", ")}`,
      });
    }

    return setShowNotification({
      show: true,
      type: "success",
      message: "Event added/updated",
      additionalMessage: "Your event has been added/updated successfully",
    });
  };

  return (
    <>
      <PageHead
        title="Manage Milstone"
        description="Here you can manage your LinkFree event"
      />

      <Page>
        <Navigation />

        <Notification
          show={showNotification.show}
          type={showNotification.type}
          onClose={() =>
            setShowNotification({ ...showNotification, show: false })
          }
          message={showNotification.message}
          additionalMessage={showNotification.additionalMessage}
        />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-x-16 lg:grid-cols-2 lg:px-8 xl:gap-x-48">
          <form
            className="space-y-8 divide-y divide-gray-200"
            onSubmit={handleSubmit}
          >
            <div className="space-y-8 divide-y divide-gray-200 sm:space-y-5">
              <div className="space-y-6 sm:space-y-5">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    What Events would you like to appear on your Profile?
                  </h3>
                </div>

                <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Input
                      name="name"
                      label="Event Name"
                      onChange={(e) => setName(e.target.value)}
                      value={name}
                      required
                      minLength="2"
                      maxLength="256"
                    />
                    <p className="text-sm text-gray-500">
                      For example: <i>EddieCon v0.1</i>
                    </p>
                  </div>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Input
                      name="description"
                      label="Description"
                      onChange={(e) => setDescription(e.target.value)}
                      value={description}
                    />
                  </div>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Input
                      type="url"
                      name="url"
                      label="Event URL"
                      onChange={(e) => setUrl(e.target.value)}
                      value={url}
                      required
                      minLength="2"
                      maxLength="256"
                    />
                  </div>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Input
                      type="date"
                      name="date"
                      label="Start Date"
                      onChange={(e) => setStartDate(e.target.value)}
                      value={startDate}
                      required
                    />
                    <p className="text-sm text-gray-500">
                      For example: <i>2022-12-09T16:00:00.000+00:00</i>
                    </p>
                  </div>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Input
                      type="date"
                      name="date"
                      label="End Date"
                      onChange={(e) => setEndDate(e.target.value)}
                      value={endDate}
                      required
                    />
                    <p className="text-sm text-gray-500">
                      For example: <i>DD / MM / YYYY</i>
                    </p>
                  </div>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Input
                      name="price"
                      label="Ticket Price"
                      onChange={(e) => setPrice(e.target.value)}
                      value={price}
                    />
                    <p className="text-sm text-gray-500">
                      Basic ticket price in USD (for free use 0)
                    </p>
                  </div>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Toggle
                      text1="Virtual?"
                      text2="Online event"
                      enabled={isVirtual}
                      setEnabled={setIsVirtual}
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-x-6">
                  <Button primary={true}>SAVE</Button>
                </div>
              </div>
            </div>
          </form>
          <div>
            <EventCard
              event={{
                name,
                description,
                url,
                date: { start: startDate, end: endDate },
                isVirtual,
                price,
              }}
            />
          </div>
        </div>
      </Page>
    </>
  );
}
