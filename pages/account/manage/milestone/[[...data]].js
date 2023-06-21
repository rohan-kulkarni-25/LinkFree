import { useState } from "react";
import { authOptions } from "../../../api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import logger from "@config/logger";
import PageHead from "@components/PageHead";
import Page from "@components/Page";
import Button from "@components/Button";
import Navigation from "@components/account/manage/navigation";
import { getMilestoneApi } from "pages/api/account/manage/milestone/[[...data]]";
import Input from "@components/form/Input";
import UserMilestone from "@components/user/UserMilestone";
import Toggle from "@components/form/Toggle";
import Notification from "@components/Notification";
import Link from "@components/Link";

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
  let milestone = {};
  if (id) {
    try {
      milestone = await getMilestoneApi(username, id);
    } catch (e) {
      logger.error(e, `milestone failed for username: ${username}`);
    }
  }

  return {
    props: { milestone, BASE_URL: process.env.NEXT_PUBLIC_BASE_URL },
  };
}

export default function ManageMilestone({ BASE_URL, milestone }) {
  const [showNotification, setShowNotification] = useState({
    show: false,
    type: "",
    message: "",
    additionalMessage: "",
  });
  const [title, setTitle] = useState(
    milestone.title || "Title of your Milestone"
  );
  const [description, setDescription] = useState(
    milestone.description || "Description of your Milestone"
  );
  const [url, setUrl] = useState(milestone.url || "");
  const [icon, setIcon] = useState(milestone.icon || "FaGithub");
  const [date, setDate] = useState(milestone.date);
  const [isGoal, setIsGoal] = useState(milestone.isGoal);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let putMilestone = {
      title,
      description,
      url,
      icon,
      date,
      isGoal,
      order: milestone.order,
    };
    let apiUrl = `${BASE_URL}/api/account/manage/milestone/`;
    if (milestone._id) {
      putMilestone = { ...putMilestone, _id: milestone._id };
      apiUrl = `${BASE_URL}/api/account/manage/milestone/${milestone._id}`;
    }
    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(putMilestone),
    });
    const update = await res.json();

    if (update.message) {
      return setShowNotification({
        show: true,
        type: "error",
        message: "Milestone update failed",
        additionalMessage: `Please check the fields: ${Object.keys(
          update.message
        ).join(", ")}`,
      });
    }

    return setShowNotification({
      show: true,
      type: "success",
      message: "Milestone added/updated",
      additionalMessage: "Your milestone has been added/updated successfully",
    });
  };

  return (
    <>
      <PageHead
        title="Manage Milstone"
        description="Here you can manage your LinkFree milestone"
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
                    What Milestones would you like to appear on your Profile?
                  </h3>
                </div>

                <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-t sm:border-gray-200 sm:pt-5">
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Input
                      name="title"
                      label="Milestone Title"
                      onChange={(e) => setTitle(e.target.value)}
                      value={title}
                      required
                      minLength="2"
                      maxLength="256"
                    />
                    <p className="text-sm text-gray-500">
                      For example: <i>GitHub Star</i>
                    </p>
                  </div>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Input
                      name="description"
                      label="Description"
                      onChange={(e) => setDescription(e.target.value)}
                      value={description}
                      required
                      minLength="2"
                      maxLength="512"
                    />
                    <p className="text-sm text-gray-500">
                      Describe this Milestone
                    </p>
                  </div>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Input
                      type="url"
                      name="url"
                      label="URL"
                      onChange={(e) => setUrl(e.target.value)}
                      value={url}
                      minLength="2"
                      maxLength="256"
                    />
                    <p className="text-sm text-gray-500">
                      Link to more information (optional)
                    </p>
                  </div>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Input
                      type="date"
                      name="date"
                      label="Date"
                      onChange={(e) => setDate(e.target.value)}
                      value={date}
                      required
                    />
                    <p className="text-sm text-gray-500">
                      For example: <i>DD / MM / YYYY</i>
                    </p>
                  </div>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Input
                      name="icon"
                      label="Icon"
                      onChange={(e) => setIcon(e.target.value)}
                      value={icon}
                      required
                      minLength="2"
                      maxLength="32"
                    />
                    <p className="text-sm text-gray-500">
                      Search for available{" "}
                      <Link href="/icons" target="_blank">
                        Icons
                      </Link>
                    </p>
                  </div>
                  <div className="mt-1 sm:col-span-2 sm:mt-0">
                    <Toggle
                      text1="Is this a future goal?"
                      text2="Future Milestone"
                      enabled={isGoal}
                      setEnabled={setIsGoal}
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
            <UserMilestone
              milestone={{ title, description, url, icon, date, isGoal }}
              isGoal={isGoal}
            />
          </div>
        </div>
      </Page>
    </>
  );
}