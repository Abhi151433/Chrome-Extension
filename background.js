import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://ksjrbbsmavsghazxfinl.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzanJiYnNtYXZzZ2hhenhmaW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAyMjc2OTMsImV4cCI6MjAwNTgwMzY5M30.rZlejX7d-LigpGrKLny8k--6z_U64BxFwGS3aWHwCzQ";

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Supabase Instance: ", supabase);

function updateTagInSupabase(postId, tagValue, postContent) {
  // Check if the post_id already exists in the UserFeedback table
  supabase
    .from("table1")
    .select("id, post_id")
    .eq("post_id", postId)
    .then((response) => {
      // If the post_id exists in the table
      if (response.data.length > 0) {
        const rowId = response.data[0].id;
        // Update the tag_value
        supabase
          .from("table1")
          .update({ tag: tagValue })
          .eq("id", rowId)
          .then((response) => {
            console.log("Row updated in Supabase:", response);
          })
          .catch((error) => {
            console.error("Error updating row in Supabase:", error);
          });
      } else {
        // If the post_id does not exist, add a new row
        const feedbackData = {
          post_id: postId,
          tag: tagValue,
          content: postContent,
        };
        supabase
          .from("table1")
          .insert([feedbackData])
          .then((response) => {
            console.log("New row added to Supabase:", response);
          })
          .catch((error) => {
            console.error("Error adding new row to Supabase:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error fetching row from Supabase:", error);
    });
}

function addNewRowInTimeLogs(postId) {
  supabase
    .from("time_logs")
    .select("*")
    .eq("post_id", postId)
    .order("revisits", { ascending: false })
    .limit(1)
    .then((response) => {
      // If the post_id exists in the table
      if (response.data.length > 0) {
        const newRevisitsValue = response.data[0].revisits + 1;
        const timeLogData = {
          post_id: postId,
          start_time: new Date(),
          end_time: null,
          revisits: newRevisitsValue,
        };
        supabase
          .from("time_logs")
          .insert([timeLogData])
          .then((response) => {
            console.log("Row added in Supabase:", response);
          })
          .catch((error) => {
            console.error("Error updating row in Supabase:", error);
          });
      } else {
        // If the post_id does not exist, add a new row
        const timeLogData = {
          post_id: postId,
          start_time: new Date(),
          end_time: null,
          revisits: 0,
        };
        supabase
          .from("time_logs")
          .insert([timeLogData])
          .then((response) => {
            console.log("New row added to Supabase:", response);
          })
          .catch((error) => {
            console.error("Error adding new row to Supabase:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error fetching row from Supabase:", error);
    });
}

function updateEndTimeInSupabase(postId) {
  supabase
    .from("time_logs")
    .select("*")
    .eq("post_id", postId)
    .order("revisits", { ascending: false })
    .limit(1)
    .then((response) => {
      // If the post_id exists in the table
      if (response.data.length > 0) {
        const startTime = new Date(response.data[0].start_time);
        const revisits = response.data[0].revisits;
        const endTime = new Date();
        const timeSpent = endTime - startTime; // Time difference in milliseconds
        const secondsSpent = Math.round(timeSpent / 1000);
        supabase
          .from("time_logs")
          .update({ end_time: endTime })
          .eq("post_id", postId)
          .eq("revisits", revisits)
          .then((response) => {
            console.log("Row updated in Supabase:", response);
          })
          .catch((error) => {
            console.error("Error updating row in Supabase:", error);
          });
        supabase
          .from("table1")
          .select("*")
          .eq("post_id", postId)
          .then((response) => {
            console.log("responseee", response);
            if (response.data.length > 0) {
              const existingTimeSpent = response.data[0].timeSpent
                ? response.data[0].timeSpent
                : 0;

              console.log("ex timeeee", existingTimeSpent);
              const newTimeSpent = existingTimeSpent + secondsSpent;
              console.log("newwww timeeee", newTimeSpent, postId);
              supabase
                .from("table1")
                .update({ timeSpent: newTimeSpent })
                .eq("post_id", postId)
                .then((response) => {
                  console.log("Row updated in Supabase table1:", response);
                })
                .catch((error) => {
                  console.error("Error updating row in Supabase:", error);
                });
            }
          })
          .catch((error) => {
            console.error("Error fetching row from Supabase:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error fetching row from Supabase:", error);
    });
}

//This will listen to the messages sent by content.js and perform the function to add/update the tag in db
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateTag") {
    const { postId, tagValue, postContent } = message.payload;
    updateTagInSupabase(postId, tagValue, postContent);
  } else if (message.type === "startTimer") {
    const { postId } = message.payload;
    addNewRowInTimeLogs(postId);
  } else if (message.type === "endTimer") {
    const { postId } = message.payload;
    updateEndTimeInSupabase(postId);
  }
});
