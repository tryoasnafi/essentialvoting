import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../alert-dialog";

interface PrivateKeyAlertProps {
  privateKey: string
  electionTitle: string
  redirectUrl: string,
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

function download(filename: string, text: string) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export default function PrivateKeyAlert({ privateKey, electionTitle, redirectUrl, isOpen, setIsOpen }: PrivateKeyAlertProps) {
  const router = useRouter();

  const formattedTitle = electionTitle.toLowerCase().replaceAll(" ", "-");
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save your secret phrase!</AlertDialogTitle>
          <AlertDialogDescription className="break-all">
            <p className="flexgap-2 my-4">{privateKey}</p>
            <small className="text-red-500">We don't save your secret phrase, make sure it's safe, and don't share it, becareful it loss permanently, we can't recover it</small>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => {
            download(`privatekey_${formattedTitle}.txt`, privateKey);
            setIsOpen(false);
            router.replace(redirectUrl);
          }}>I understand</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}