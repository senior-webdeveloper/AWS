import Channel from "./components/Channel";
import NewsItem from "./components/NewsItem";
import { useEffect, useState } from "react";

const App = () => {
  const [channel, setChannel] = useState([]);
  const [news, setNews] = useState([]);

  return (
    <div className="container">
      <Channel newsData={news} user={channel} setUser={setChannel} />
      <NewsItem channelData={channel} user={news} setUser={setNews} />
    </div>
  );
};

export default App;
