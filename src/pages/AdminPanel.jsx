import { Button, Form, Input, message, Modal, Select, Table } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { BASE_URL, token } from "../config";

const { Option } = Select;

const AdminPanel = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/workers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkers(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch workers", error);
      message.error("Failed to fetch workers");
      setLoading(false);
    }
  };

  const approveWorker = async (id) => {
    try {
      // console.log(`Approving worker with ID: ${id}`);
      const response = await axios.patch(
        `${BASE_URL}/workers/approve-worker/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // console.log("Approve response:", response);
      message.success("Worker approved successfully");
      fetchWorkers();
    } catch (error) {
      console.error("Failed to approve worker", error);
      message.error("Failed to approve worker");
    }
  };

  const editWorker = (worker) => {
    setSelectedWorker(worker);
    form.setFieldsValue(worker);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedWorker(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // console.log("Updating worker with values:", values);
      const response = await axios.put(
        `${BASE_URL}/workers/${selectedWorker._id}`,
        values,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Update response:", response);
      message.success("Worker updated successfully");
      fetchWorkers();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Failed to update worker", error);
      message.error("Failed to update worker");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Specialization",
      dataIndex: "specialization",
      key: "specialization",
    },
    {
      title: "Status",
      dataIndex: "isApproved",
      key: "isApproved",
      render: (text) => <span>{text}</span>,
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <div>
          <Button
            type="primary"
            disabled={record.isApproved === "approved"}
            onClick={() => approveWorker(record._id)}
          >
            Approve
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => editWorker(record)}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={workers}
        loading={loading}
        rowKey="_id"
      />
      <Modal
        title="Edit Worker"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input the name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please input the email!" }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: "Please input the phone number!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="specialization"
            label="Specialization"
            rules={[
              { required: true, message: "Please select the specialization!" },
            ]}
          >
            <Select>
                <option value="Aged Care">Aged Care</option>
                <option value="Disability Care">Disability Care</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Travel and Transport">Travel and Transport</option>
                <option value="Gardening">Gardening</option>
                <option value="Companionship">Companionship</option>
            </Select>
          </Form.Item>
          <Form.Item
            name="bio"
            label="Bio"
            rules={[{ required: true, message: "Please input the bio!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="ticketPrice"
            label="Ticket Price"
            rules={[
              { required: true, message: "Please input the ticket price!" },
            ]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPanel;
