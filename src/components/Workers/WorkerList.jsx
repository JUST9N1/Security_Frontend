import { BASE_URL } from "../../config";
import useFetchData from "../../hooks/useFetchData";
import Error from "../Error/Error";
import Loader from "../Loader/Loading";
import WorkerCard from "./WorkerCard";

const WorkerList = () => {
  const { data: workers, loading, error } = useFetchData(`${BASE_URL}/workers`);


  const workersArray = Array.isArray(workers) ? workers : [];

  return (
    <>
      {loading && <Loader />}
      {error && <Error message={error.message} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 lg:gap-8 mt-8 lg:mt-14">
          {workersArray.map((worker) => (
            <WorkerCard key={worker?._id} worker={worker} />
          ))}
        </div>
      )}
    </>
  );
};

export default WorkerList;
