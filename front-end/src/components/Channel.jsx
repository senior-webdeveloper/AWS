import React, { useEffect, useState } from "react";
import MaterialTable from "material-table";
import { Alert, AlertTitle } from "@material-ui/lab";
import "../App.css";
import axios from "axios";
import $ from "jquery";

const Channel = ({ user, setUser, newsData }) => {
  const [iserror, setIserror] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);

  let columns = [
    { title: "id", field: "id", hidden: true },
    { title: "NAME", field: "channelName" },
  ];

  useEffect(() => {
    $.get(`http://localhost:3001/getCh/`).then((res) => {
      const users = res;
      setUser(users);
    });
  }, []);

  //function for updating the existing row details
  const handleRowUpdate = (newData, oldData, resolve) => {
    // validating the data inputs
    let errorList = [];
    if (newData.name === "") {
      errorList.push("Try Again, You didn't enter the Name field");
    }
    if (errorList.length < 1) {
      $.post(`http://localhost:3001/updateCh/`, newData)
        // $("#YourElementID").css("display","block");
        .then((response) => {
          const updateUser = [...user];
          const index = oldData.tableData.id;
          updateUser[index] = newData;
          setUser([...updateUser]);
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
    let obj = newsData.find((o) => o.channel_id === oldData.id);
    if (obj) {
      setErrorMessages(["You can't delete it because it has news."]);
      setIserror(true);
      resolve();
    }

    $.get(`http://localhost:3001/deleteCh/`, { deleteId: oldData.id })
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
    if (!newData.channelName) {
      errorList.push("Try Again, Enter Name before submitting");
    }
    if (errorList.length < 1) {
      axios
        .post(" http://localhost:3001/createCh", newData)
        .then((response) => {
          const { id } = response.data;
          let items = { ...newData, id };
          let newUserdata = [...user];

          newUserdata.push(items);
          setUser(newUserdata);
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
    <div className="channel">
      <br /> <br />
      <MaterialTable
        title="Channel"
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

export default Channel;
