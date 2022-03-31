import React, { useEffect, useState } from "react";
import MaterialTable from "material-table";
import { Alert, AlertTitle } from "@material-ui/lab";
import FileUpload from "react-material-file-upload";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import "../App.css";
import axios from "axios";
import $ from "jquery";

const NewsItem = ({ channelData, user, setUser }) => {
  const [iserror, setIserror] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [channel, setChannel] = useState("");

  const handleChange = (event) => {
    setChannel(event.target.value);
  };

  let columns = [
    { title: "id", field: "id", hidden: true },
    { title: "channel_id", field: "channel_id", hidden: true },
    { title: "Channel", field: "channel" },
    { title: "url", field: "url", hidden: true },
    { title: "NAME", field: "title" },
    { title: "Content", field: "content" },
    {
      title: "File",
      field: "attachment",
      render: (rowData) => <a href={rowData.url}>{rowData.attachment}</a>,
    },
    { title: "Expiration_date", field: "expiration_date", type: "datetime" },
    { title: "Entered_date", field: "entered_date" },
  ];

  useEffect(() => {
    $.get(`http://localhost:3001/get/`).then((res) => {
      const users = res;
      setUser(users);
    });
  }, []);

  //function for updating the existing row details
  const handleRowUpdate = (newData, oldData, resolve) => {
    // validating the data inputs
    let errorList = [];

    if (newData.title === "") {
      errorList.push("Try Again, You didn't enter the title field");
    }
    if (newData.content === "") {
      errorList.push("Try Again, You didn't enter the content field");
    }
    if (newData.expiration_date === "") {
      errorList.push(
        "Try Again, Enter website expiration_date before submitting"
      );
    }
    if (errorList.length < 1) {
      $.post(`http://localhost:3001/update/`, newData)
        // $("#YourElementID").css("display","block");
        .then((response) => {
          const updateUser = [...user];
          const index = oldData.tableData.id;
          updateUser[index] = newData;
          setUser([...updateUser]);
          setFiles([]);
          setChannel("");
          resolve();
          setIserror(false);
          setErrorMessages([]);
        })
        .catch((error) => {
          setErrorMessages(["Update failed! Server error"]);
          setIserror(true);
          resolve();
        });
    } else {
      setErrorMessages(errorList);
      setIserror(true);
      resolve();
    }
  };

  //function for deleting a row
  const handleRowDelete = (oldData, resolve) => {
    $.get(`http://localhost:3001/delete/`, {
      deleteId: oldData.id,
      key: oldData.attachment,
      channel_id: oldData.channel_id,
    })
      .then((response) => {
        const dataDelete = [...user];
        const index = oldData.tableData.id;
        dataDelete.splice(index, 1);
        setUser([...dataDelete]);
        resolve();
      })
      .catch((error) => {
        setErrorMessages(["Delete failed! Server error"]);
        setIserror(true);
        resolve();
      });
  };

  //function for adding a new row to the table
  const handleRowAdd = (newData, resolve) => {
    //validating the data inputs
    let errorList = [];
    if (!newData.title) {
      errorList.push("Try Again, You didn't enter the Name field");
    }
    if (!newData.content) {
      errorList.push("Try Again, You didn't enter the Content field");
    }
    if (!newData.expiration_date) {
      errorList.push(
        "Try Again, Enter website Expiration_date before submitting"
      );
    }
    if (files.length === 0) {
      errorList.push("Try Again, Enter website attachment before submitting");
    }
    if (!channel) {
      errorList.push("Try Again, Enter Channel before submitting");
    }
    if (errorList.length < 1) {
      // attachment
      let formData = new FormData();

      for (const key in newData) {
        formData.append(key, newData[key]);
      }
      formData.append("file", files[0]);
      formData.append("channel_id", channel);

      axios
        .post(" http://localhost:3001/create", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          const { id, channelName, datetime, fileUrl, attachment } =
            response.data;

          let items = {
            ...newData,
            id,
            channel: channelName,
            channel_id: channel,
            entered_date: datetime,
            url: fileUrl,
            attachment: attachment,
          };
          let newUserdata = [...user];

          newUserdata.push(items);

          setUser(newUserdata);
          setFiles([]);
          setChannel("");
          resolve();
          setErrorMessages([]);
          setIserror(false);
        })
        .catch((error) => {
          setErrorMessages(["Cannot add data. Server error!"]);
          setIserror(true);
          resolve();
        });
    } else {
      setErrorMessages(errorList);
      setIserror(true);
      resolve();
    }
  };

  return (
    <div className="newsItem">
      <br />
      <div className="secondInput">
        <FileUpload value={files} onChange={setFiles} />
        <Select
          labelId="demo-simple-select-autowidth-label"
          id="demo-simple-select-autowidth"
          value={channel}
          onChange={handleChange}
          autoWidth
          label="Channel"
        >
          <MenuItem value="">
            <em>Select Channel</em>
          </MenuItem>
          {channelData.map((item, index) => (
            <MenuItem key={index} value={item.id}>
              {item.channelName}
            </MenuItem>
          ))}
        </Select>
      </div>
      <br />
      <MaterialTable
        title="News"
        columns={columns}
        data={user}
        options={{
          headerStyle: {
            borderBottomColor: "red",
            borderBottomWidth: "3px",
            fontFamily: "verdana",
          },
          actionsColumnIndex: -1,
        }}
        editable={{
          onRowUpdate: (newData, oldData) =>
            new Promise((resolve) => {
              handleRowUpdate(newData, oldData, resolve);
            }),
          onRowAdd: (newData) =>
            new Promise((resolve) => {
              handleRowAdd(newData, resolve);
            }),
          onRowDelete: (oldData) =>
            new Promise((resolve) => {
              handleRowDelete(oldData, resolve);
            }),
        }}
      />

      <div>
        {" "}
        {iserror && (
          <Alert severity="error">
            <AlertTitle> ERROR </AlertTitle>{" "}
            {errorMessages.map((msg, i) => {
              return <div key={i}> {msg} </div>;
            })}{" "}
          </Alert>
        )}{" "}
      </div>
    </div>
  );
};

export default NewsItem;
