import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";
import ProfileImage from "./ProfileImage";
import { useSession } from "next-auth/react";
import { VscHeart, VscHeartFilled } from "react-icons/vsc";
import IconHoverEffect from "./IconHoverEffect";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./Loader";

type Tweet = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  likedByMe: boolean;
  user: { id: string; image: string | null; name: string | null };
};

type InfiniteTweetListProps = {
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean | undefined;
  fetchNewTweets: () => Promise<unknown>;
  tweets?: Tweet[];
};

export default function InfiniteTweetList({
  tweets,
  isError,
  isLoading,
  fetchNewTweets,
  hasMore,
}: InfiniteTweetListProps) {

  if (isLoading) return <LoadingSpinner big={false} />;

  if (isError) return <h1>Erorr .. </h1>;

  if (tweets == null) return null;

  if (tweets == null || tweets?.length == 0)
    return (
      <h2 className="my-4 text-center text-2xl text-gray-500">No Tweets</h2>
    );

  let boolHasMore: boolean;

  if (hasMore == false || hasMore == undefined) boolHasMore = false;
  else boolHasMore = true;


  return (
    <ul>
      <InfiniteScroll
        dataLength={tweets.length}
        next={fetchNewTweets}
        hasMore={boolHasMore}
        loader={<LoadingSpinner big={false} />}
      >
        {tweets.map((tweet) => (
          <TweetCard key={tweet.id} {...tweet} />
        ))}
      </InfiniteScroll>
    </ul>
  );
}



const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});



function TweetCard({
  id,
  user,
  content,
  createdAt,
  likeCount,
  likedByMe,
}: Tweet) {
  const trpcUtils = api.useUtils()
  const toggleLike = api.tweet.toggleLike.useMutation({onSuccess : async({addedLike}) => {

    const updateData: Parameters<typeof trpcUtils.tweet.infiniteFeed.setInfiniteData>[1] = (oldData) => {
      if(oldData == null) return 

      const countModifier = addedLike ? 1 : -1;

      return {
        ...oldData,
        pages: oldData.pages.map(page => {
          return{
            ...page,
            tweets: page.tweets.map(tweet => {
              if(tweet.id == id){
                return {
                  ...tweet,
                  likeCount: tweet.likeCount + countModifier,
                  likedByMe: addedLike
                }
              }

              return tweet;
            })
          }
        })
      }
    }
    trpcUtils.tweet.infiniteFeed.setInfiniteData({}, updateData)
    trpcUtils.tweet.infiniteFeed.setInfiniteData({onlyFollowing: true}, updateData)
    trpcUtils.tweet.infiniteProfileFeed.setInfiniteData({userId: user.id}, updateData)
  }})

  function handleToggleLike () {
    toggleLike.mutate({id})
  }

  return (
    <li className="flex gap-4 border-b px-4 py-4">
      <Link href={`/profiles/${user.id}`}>
        <ProfileImage src={user.image} />
      </Link>
      <div className="flex flex-grow flex-col ">
        <div className="flex gap-1 ">
          <Link
            href={`/profiles/${user.id}`}
            className="font-bold hover:underline focus-visible:underline"
          >
            {user.name}
          </Link>
          <span className="text-gray-500">-</span>
          <span className="text-gray-500">
            {dateTimeFormatter.format(createdAt)}
          </span>
        </div>
        <p className=" whitespace-pre-wrap">{content}</p>
        <HeartButton onClick={handleToggleLike} isLoading={toggleLike.isLoading} likedByMe={likedByMe} likeCount={likeCount} />
      </div>
    </li>
  );
}


type HeartButtonProps = {
  onClick: () => void,
  isLoading: boolean,
  likedByMe: boolean;
  likeCount: number;
};



function HeartButton({ isLoading , onClick, likedByMe, likeCount }: HeartButtonProps) {
  const session = useSession();

  const HeartIcon = likedByMe ? VscHeartFilled : VscHeart;

  if (session.status !== "authenticated") {
    return (
      <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
        <HeartIcon />
        <span>{likeCount}</span>
      </div>
    );
  }

  return (
    <button
    disabled={isLoading}
    onClick={onClick}
      className={`group flex items-center gap-1 self-start transition-colors duration-200 ${likedByMe ? "text-red-500" : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"}  -ml-2`}
    >
        <IconHoverEffect red = {true}>

        <HeartIcon className={`transition-colors duration-200 ${likedByMe 
        ? "fill-red-500" 
        : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500"}`}
        />
        </IconHoverEffect>
        <span>{likeCount}</span>
    </button>
  );
}
