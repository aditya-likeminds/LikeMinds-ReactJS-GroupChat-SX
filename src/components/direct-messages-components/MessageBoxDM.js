import {
  Box,
  Dialog,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
} from "@mui/material";
import { useContext, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { communityId, myClient, UserContext } from "../..";
import { GroupContext } from "../../Main";
import ReportConversationDialogBox from "../extras-and-common/ReportConversationDialogBox";
import emojiIcon from "../../assets/svg/smile.svg";
import moreIcon from "../../assets/svg/more-vertical.svg";
import pdfIcon from "../../assets/svg/pdf-document.svg";
import EmojiPicker from "emoji-picker-react";
import parse from "html-react-parser";
import {
  addReaction,
  deleteChatFromDM,
  getChatRoomDetails,
  getConversationsForGroup,
  linkConverter,
  tagExtracter,
  undoBlock,
} from "../../sdkFunctions";
import { directMessageInfoPath, directMessagePath } from "../../routes";
import { DmContext } from "./DirectMessagesMain";

async function getChatroomConversations(chatroomId, pageNo, dmContext) {
  if (chatroomId == null) {
    return;
  }
  // // console.log(chatroomId);
  let optionObject = {
    chatroomID: chatroomId,
    page: pageNo,
  };
  let response = await getConversationsForGroup(optionObject);
  if (!response.error) {
    let conversations = response.data;
    let conversationToBeSetArray = [];
    let newConversationArray = [];
    let lastDate = "";
    for (let convo of conversations) {
      if (convo.date === lastDate) {
        conversationToBeSetArray.push(convo);
        lastDate = convo.date;
      } else {
        if (conversationToBeSetArray.length != 0) {
          newConversationArray.push(conversationToBeSetArray);
          conversationToBeSetArray = [];
          conversationToBeSetArray.push(convo);
          lastDate = convo.date;
        } else {
          conversationToBeSetArray.push(convo);
          lastDate = convo.date;
        }
      }
    }
    newConversationArray.push(conversationToBeSetArray);
    dmContext.setCurrentChatroomConversations(newConversationArray);
  } else {
    // // console.log(response.errorMessage);
  }
}

function MessageBoxDM({
  username,
  messageString,
  time,
  userId,
  attachments,
  convoId,
  conversationReactions,
  conversationObject,
  replyConversationObject,
}) {
  let [userString, setUserString] = useState("");
  let userContext = useContext(UserContext);

  let dmContext = useContext(DmContext);
  if (conversationObject.state !== 0) {
    return (
      <div className="mx-auto text-center rounded-[4px] text-[14px] w-full font-[300] text-[#323232]">
        {conversationObject.state === 1 ? (
          <>
            <span id="state-1">
              {parse(
                linkConverter(tagExtracter(messageString, userContext, 1))
              )}
            </span>
          </>
        ) : (
          <>
            {parse(linkConverter(tagExtracter(messageString, userContext)))}
            {conversationObject.state === 19 &&
            dmContext.currentChatroom.chat_request_state === 2 ? (
              <>
                <span
                  className="text-[#3884f7] cursor-pointer"
                  onClick={() => {
                    undoBlock(conversationObject.chatroom_id).then((r) => {
                      getChatroomConversations(
                        dmContext.currentChatroom.id,
                        1000,
                        dmContext
                      ).then(() => {
                        getChatRoomDetails(
                          myClient,
                          dmContext.currentChatroom.id
                        ).then((e) => {
                          // // console.log(e);
                          dmContext.setCurrentChatroom(e.data.chatroom);
                          dmContext.setCurrentProfile(e.data);
                        });
                      });
                    });
                  }}
                >
                  {" "}
                  Tap to Undo
                </span>
              </>
            ) : null}
          </>
        )}
      </div>
    );
  }
  return (
    <div>
      <Box className="flex mb-4">
        <Snackbar
          open={dmContext.showSnackBar}
          message={dmContext.snackBarMessage}
          autoHideDuration={1000}
          onClose={() => {
            dmContext.setShowSnackBar(false);
            dmContext.setSnackBarMessage("");
          }}
        />
        <StringBox
          username={username}
          messageString={messageString}
          time={time}
          userId={userId}
          attachments={attachments}
          replyConversationObject={replyConversationObject}
          conversationObject={conversationObject}
        />
        <MoreOptions convoId={convoId} convoObject={conversationObject} />
      </Box>
      <div>
        {conversationReactions.map((reactionObject, reactionObjectIndex) => {
          return (
            <ReactionIndicator
              reaction={reactionObject.reaction}
              key={reactionObjectIndex}
            />
          );
        })}
      </div>
    </div>
  );
}

function ReactionIndicator({ reaction }) {
  return <span className="text-normal mx-1">{reaction}</span>;
}

function StringBox({
  username,
  messageString,
  time,
  userId,
  attachments,
  replyConversationObject,
  conversationObject,
}) {
  const ref = useRef(null);
  const dmContext = useContext(DmContext);
  const userContext = useContext(UserContext);
  const navigate = useNavigate();
  const [displayMediaModal, setDisplayMediaModel] = useState(false);

  const [mediaData, setMediaData] = useState(null);

  return (
    <div
      className="flex flex-col py-[16px] px-[20px] min-w-[282px] max-w-[350px] border-[#eeeeee] rounded-[10px] break-all"
      style={{
        background:
          userId === userContext.currentUser.id ? "#ECF3FF" : "#FFFFFF",
      }}
    >
      <DialogBoxMediaDisplay
        shouldOpen={displayMediaModal}
        onClose={() => setDisplayMediaModel(false)}
        mediaData={mediaData}
      />
      <div className="flex w-full justify-between mb-1 clear-both">
        <div className="text-[12px] leading-[14px] text-[#323232] font-[700] capitalize">
          <Link
            to={directMessageInfoPath}
            state={{
              communityId: userContext.community.id,
              memberId: userId,
            }}
          >
            {userId === userContext.currentUser.id ? "you" : username}
          </Link>
        </div>
        <div className="text-[10px] leading-[12px] text-[#323232] font-[300]">
          {time}
        </div>
      </div>

      {conversationObject.deleted_by !== undefined ? (
        <span className="text-[14px] w-full font-[300] text-[#323232]">
          This message has been deleted.
        </span>
      ) : (
        <div className="flex w-full flex-col">
          <div className="w-full mb-1">
            {(() => {
              if (attachments !== null && attachments.length < 2) {
                return attachments
                  .filter((item, itemIndex) => {
                    return item.type === "image";
                  })
                  .map((item, itemIndex, dataObj) => {
                    return (
                      <img
                        src={item.url}
                        alt=""
                        className="m-1 w-full max-h-[230px]"
                        key={item.url}
                        onClick={() => {
                          setMediaData({ mediaObj: dataObj, type: "image" });
                          setDisplayMediaModel(true);
                        }}
                      />
                    );
                  });
              }
              return null;
            })()}

            {attachments != null && attachments.length > 1
              ? attachments
                  .filter((item, itemIndex, obj) => {
                    return item.type === "image";
                    // Why was the limit for only two photos made here
                    // && itemIndex < 2;
                  })
                  .map((item, itemIndex, dataObj) => {
                    return (
                      <>
                        {itemIndex <= 3 ? (
                          <div className="m-1 w-[146px] h-[146px] float-left rounded-md overflow-hidden relative">
                            <img
                              src={item.url}
                              alt=""
                              className="w-full h-full"
                              key={item.url}
                              onClick={() => {
                                setMediaData({
                                  mediaObj: dataObj,
                                  type: "image",
                                });
                                setDisplayMediaModel(true);
                              }}
                            />

                            {itemIndex === 3 && dataObj.length > 4 ? (
                              <div className="absolute text-white text-4 font-700 top-0 left-0 w-[146px] h-[146px] customBg flex justify-center items-center">
                                + {dataObj.length - (itemIndex + 1)}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    );
                  })
              : null}

            {attachments != null
              ? attachments
                  .filter((item, itemIndex) => {
                    return item.type === "audio";
                  })
                  .map((item, itemIndex) => {
                    return (
                      <audio
                        controls
                        src={item.url}
                        className="my-2 w-[230]"
                        key={item.url}
                      >
                        {" "}
                        <a href={item.url}>Download audio</a>
                      </audio>
                    );
                  })
              : null}
            {attachments !== null
              ? attachments
                  .filter((item, itemIndex) => {
                    return item.type === "pdf";
                  })
                  .map((item, itemIndex) => {
                    return (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-2 w-[200px] flex"
                        key={item.url}
                      >
                        <img src={pdfIcon} alt="pdf" className="w-[24px]" />
                        <span className="text-[#323232] text-[14px] ml-2 mt-1">
                          {item.name}
                        </span>
                        <br />
                      </a>
                    );
                  })
              : null}

            {attachments != null
              ? attachments
                  .filter((item, itemIndex, obj) => {
                    return item.type === "video";
                  })
                  .map((item, itemIndex, dataObj) => {
                    return (
                      <video
                        controls="controls"
                        preload="none"
                        className="my-2 w-[200] h-max-[200px] "
                        key={item.url}
                        onClick={() => {
                          setMediaData({
                            mediaObj: dataObj,
                            type: "video",
                          });
                          setDisplayMediaModel(true);
                        }}
                      >
                        <source src={item.url} type="video/mp4" />
                        <source src={item.url} type="video/ogg" />
                        Your browser does not support the video tag.
                      </video>
                    );
                  })
              : null}
          </div>

          {replyConversationObject != null ? (
            <div className="flex flex-col border-[1px] border-l-[5px] border-[#70A9FF] py-1 px-2 rounded-[5px] mb-1">
              <div className="text-[#70A9FF] font-bold text-[12px]">
                {replyConversationObject?.member?.name}
              </div>
              <div className="text-[#323232] font-[300] text-[12px]">
                {replyConversationObject?.answer}
              </div>
            </div>
          ) : null}

          <div className="text-[14px] w-full font-[300] text-[#323232]">
            <span className="msgCard" ref={ref}>
              {parse(linkConverter(tagExtracter(messageString, userContext)))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeBox({ time }) {
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 300,
        color: "#323232",
      }}
    >
      {time}
    </span>
  );
}

function MoreOptions({ convoId, userId, convoObject }) {
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const userContext = useContext(UserContext);
  const dmContext = useContext(DmContext);
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const [shouldShow, setShouldShowBlock] = useState(false);
  let open = Boolean(anchor);
  const [anchorEl, setAnchorEl] = useState(null);
  const ref2 = useRef(null);
  const handleOpen = () => {
    setAnchorEl(ref.current);
  };
  const handleCloseEmoji = () => {
    setAnchorEl(null);
  };
  const ref = useRef(null);
  useState(() => {
    const handleCloseFunction = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setAnchor(null);
      }
    };
    document.addEventListener("click", handleCloseFunction);
    return () => {
      document.removeEventListener("click", handleCloseFunction);
    };
  });
  async function onClickhandlerReport(id, reason, convoid) {
    try {
      const deleteCall = await myClient.pushReport({
        tag_id: id,
        reason: reason,
        conversation_id: convoid,
      });
      setShouldShowBlock(!shouldShow);
      // // console.log(deleteCall);
    } catch (error) {
      // // console.log(error);
    }
  }

  async function getChatroomConversations(chatroomId, pageNo) {
    if (chatroomId == null) {
      return;
    }
    // // console.log(chatroomId);
    let optionObject = {
      chatroomID: chatroomId,
      page: pageNo,
    };
    let response = await getConversationsForGroup(optionObject);
    if (!response.error) {
      let conversations = response.data;
      sessionStorage.setItem("dmLastConvo", conversations[0].id);
      dmContext.setCurrentChatroomConversations(conversations);
    } else {
      // // console.log(response.errorMessage);
    }
  }

  const options = [
    {
      title: "Reply",
      clickFunction: (e) => {
        dmContext.setIsConversationSelected(true);
        dmContext.setConversationObject(convoObject);
      },
    },
    {
      title: "Report",
      clickFunction: () => {
        setShouldShowBlock(!shouldShow);
      },
    },
    {
      title: "delete",
      clickFunction: (e) => {
        let convos = [...dmContext.currentChatroomConversations];
        deleteChatFromDM([convoId])
          .then((r) => {
            getChatroomConversations(convoObject.chatroom_id, 500);
          })
          .catch((e) => {
            // console.log(e);
            dmContext.setShowSnackBar(true);
            dmContext.setSnackBarMessage(" error occoured");
            // dmContext.setSnackBarMessage("Error in Deleing Message");
          });
      },
    },
  ];

  return (
    <Box className="flex items-center">
      <IconButton ref={ref2} onClick={handleOpen}>
        <img src={emojiIcon} alt="emo" width={"20px"} height="20px" />
      </IconButton>
      <IconButton
        ref={ref}
        onClick={(e) => {
          setAnchor(e.currentTarget);
        }}
        className="my-auto"
      >
        {/* <MoreVertIcon /> */}
        <img src={moreIcon} alt="More vertical icon" />
        {/* <MoreVertIcon /> */}
      </IconButton>
      <Menu
        sx={{
          width: "250px",
        }}
        open={open}
        anchorEl={anchor}
      >
        {options.map((option, optionIndex) => {
          if (
            option.title === "Report" &&
            convoObject.member.id == userContext.currentUser.id
          ) {
            return null;
          }
          return (
            <MenuItem
              key={option.title}
              onClick={option.clickFunction}
              sx={{
                padding: "10px 20px",
                color: "#323232",
                borderBottom: "1px solid #eeeeee",
                fontSize: "14px",
              }}
            >
              {option.title}
            </MenuItem>
          );
        })}
      </Menu>
      <Dialog
        open={shouldShow}
        onClose={() => {
          setShouldShowBlock(false);
        }}
      >
        <ReportConversationDialogBox
          convoId={convoId}
          shouldShow={shouldShow}
          onClick={onClickhandlerReport}
          closeBox={() => {
            setShouldShowBlock(false);
          }}
        />
      </Dialog>
      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseEmoji}
      >
        <EmojiPicker
          onEmojiClick={(e) => {
            addReaction(e.emoji, convoId, dmContext.currentChatroom.id).then(
              (r) => {
                getChatroomConversations(dmContext.currentChatroom.id, 1000);
              }
            );

            handleCloseEmoji();
          }}
        />
      </Menu>
    </Box>
  );
}

function DialogBoxMediaDisplay({ onClose, shouldOpen, mediaData }) {
  return (
    <Dialog open={shouldOpen} onClose={onClose}>
      {mediaData !== null && mediaData.type === "image"
        ? mediaData?.mediaObj.map((item, itemIndex) => {
            return (
              <>
                <img src={item?.url} alt="img" className="max-w-[700px]" />
              </>
            );
          })
        : mediaData?.mediaObj.map((item, itemIndex) => {
            return (
              <>
                <video
                  className="w-[500] h-max-[200px]"
                  controls
                  key={item?.url}
                >
                  <source src={item?.url} type="video/mp4" />
                  <source src={item?.url} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
              </>
            );
          })}
    </Dialog>
  );
}

export default MessageBoxDM;