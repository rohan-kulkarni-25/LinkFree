import { authOptions } from "../../api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import { useState } from "react";

import logger from "@config/logger";
import PageHead from "@components/PageHead";
import Page from "@components/Page";
import Navigation from "@components/account/manage/navigation";
import { getTestimonialsApi } from "pages/api/account/manage/testimonials";
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

  let testimonials = [];
  try {
    testimonials = await getTestimonialsApi(username);
  } catch (e) {
    logger.error(e, `profile loading failed links for username: ${username}`);
  }

  return {
    props: {
      testimonials,
      BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    },
  };
}

export default function Testimonials({ BASE_URL, testimonials }) {
  const [showNotification, setShowNotification] = useState(false);
  const [testimonialList, setTestimonialList] = useState(testimonials || []);

  const toggle = async (username) => {
    const testimonials = testimonialList.map((t) => ({
      ...t,
      isPinned: t.username === username ? !t.isPinned : t.isPinned,
    }));
    setTestimonialList(testimonials);
    await save(testimonials);
  };

  const save = async (testimonials) => {
    const res = await fetch(`${BASE_URL}/api/account/manage/testimonials`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        testimonials.filter((t) => t.isPinned).map((t) => t.username)
      ),
    });
    await res.json();
    setShowNotification(true);
  };

  return (
    <>
      <PageHead
        title="Manage Testimonials"
        description="Here you can manage your LinkFree testimonials"
      />

      <Page>
        <Navigation />

        <Notification
          show={showNotification}
          type="success"
          onClose={() => setShowNotification(false)}
          message="Testimonial saved"
          additionalMessage="Your profile information has been saved successfully."
        />

        <div>
          <ul role="list" className="divide-y divide-gray-100">
            {testimonialList.map((testimonial) => (
              <li
                key={testimonial._id}
                className="flex items-center justify-between gap-x-6 py-5"
              >
                <div className="min-w-0">
                  <div className="flex items-start gap-x-3">
                    <p className="text-sm font-semibold leading-6 text-gray-900">
                      {testimonial.username}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                    <p className="whitespace-normal">
                      {testimonial.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-x-4">
                  <Toggle
                    enabled={testimonial.isPinned}
                    setEnabled={() => toggle(testimonial.username)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Page>
    </>
  );
}