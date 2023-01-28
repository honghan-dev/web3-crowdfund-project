import React, { useContext, createContext } from "react";

import {
	useAddress,
	useContract,
	useMetamask,
	useContractWrite,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
	const { contract } = useContract(
		"0xc3A6076A30d24e38E4d943B10BA9e371434dc478"
	);
	const { mutateAsync: createCampaign } = useContractWrite(
		contract,
		"createCampaign"
	);

	const address = useAddress();
	const connect = useMetamask();

	/**
	 * Tp create new campaign
	 * @param {*} form Form data which are filled up by user
	 */
	const publishCampaign = async (form) => {
		try {
			const data = await createCampaign([
				address, // owner
				form.title, // title
				form.description, // description
				form.target,
				new Date(form.deadline).getTime(), // deadline,
				form.image,
			]);

			console.log("contract call success", data);
		} catch (error) {
			console.log("contract call failure", error);
		}
	};

	/**
	 * @returns All campaigns
	 */
	const getCampaigns = async () => {
		const campaigns = await contract.call("getCampaigns");
		const parsedCampaigns = campaigns.map((campaign, i) => ({
			owner: campaign.owner,
			title: campaign.title,
			description: campaign.description,
			target: ethers.utils.formatEther(campaign.target.toString()),
			deadline: campaign.deadline.toNumber(),
			amountCollected: ethers.utils.formatEther(
				campaign.amountCollected.toString()
			),
			image: campaign.image,
			pId: i,
		}));
		return parsedCampaigns;
	};

	/**
	 * @returns Campaign created by the connected wallet address
	 */
	const getUserCampaigns = async () => {
		const allCampaigns = await getCampaigns();

		const filteredCampaigns = allCampaigns.filter(
			(campaign) => campaign.owner === address
		);
		console.log(address);
		console.log(filteredCampaigns);
		return filteredCampaigns;
	};

	const donate = async (pId, amount) => {
		const data = await contract.call("donateToCampaign", pId, {
			value: ethers.utils.parseEther(amount),
		});

		return data;
	};

	const getDonations = async (pId) => {
		const donation = await contract.call("getDonators", pId);
		const numberOfDonations = donation[0].length;

		const parsedDonations = [];

		for (let i = 0; i < numberOfDonations; i++) {
			parsedDonations.push({
				donator: donation[0][i],
				donation: ethers.utils.formatEther(donation[1][i].toString()),
			});
		}

		return parsedDonations;
	};

	return (
		<StateContext.Provider
			value={{
				address,
				contract,
				connect,
				createCampaign: publishCampaign,
				getCampaigns,
				getUserCampaigns,
				donate,
				getDonations,
			}}
		>
			{children}
		</StateContext.Provider>
	);
};

export const useStateContext = () => useContext(StateContext);
