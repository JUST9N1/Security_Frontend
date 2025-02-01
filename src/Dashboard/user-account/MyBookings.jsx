import Error from "../../components/Error/Error";
import Loading from "../../components/Loader/Loading";
import WorkerCard from "../../components/Workers/WorkerCard";
import { BASE_URL } from "../../config";
import useFetchData from "../../hooks/useFetchData";


const MyBookings = () => {
  const {
    data: appointments,
    loading,
    error,
  } = useFetchData(`${BASE_URL}/users/appointments/my-appointments`);

  return (
    <div>
      {loading && !error && <Loading />}
      {error && !loading && <Error errMessage={error} />}

      {!loading && !error && (
        <>
          {Array.isArray(appointments) && appointments.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {appointments.map((worker) => (
                <WorkerCard worker={worker} key={worker._id} />
              ))}
            </div>
          ) : (
            <h2 className="mt-5 text-center leading-7 text-[20px] font-semibold text-primaryColor">
              You did not book any worker yet!
            </h2>
          )}
        </>
      )}
    </div>
  );
};

export default MyBookings;
